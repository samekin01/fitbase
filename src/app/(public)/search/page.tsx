import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GymListItem } from "@/components/gym/GymListItem";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { GYM_LIST_SELECT, toGymSummary } from "@/lib/gym-query";
import { GymMap } from "@/components/map/GymMap";
import type { GymPin } from "@/components/map/GymMap";

export const metadata: Metadata = {
  title: "ジム検索",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const FEATURE_FILTERS = [
  { param: "trial",     label: "体験レッスンあり", col: "has_trial" },
  { param: "female",    label: "女性向け",          col: "is_female_friendly" },
  { param: "private",   label: "完全個室",          col: "has_private_room" },
  { param: "nutrition", label: "食事指導あり",      col: "has_nutrition_support" },
  { param: "station",   label: "駅近",              col: "is_near_station" },
  { param: "contest",   label: "コンテスト対応",    col: "supports_contest" },
] as const;

const PRICE_OPTIONS = [
  { label: "指定なし", value: "" },
  { label: "〜¥30,000", value: "30000" },
  { label: "〜¥50,000", value: "50000" },
  { label: "〜¥80,000", value: "80000" },
] as const;

function buildUrl(base: URLSearchParams, overrides: Record<string, string | null>): string {
  const p = new URLSearchParams(base);
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) p.delete(k);
    else p.set(k, v);
  }
  p.delete("page");
  const qs = p.toString();
  return `/search${qs ? `?${qs}` : ""}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const raw = await searchParams;
  const q = raw.q?.trim() ?? "";
  const prefSlug = raw.pref ?? "";
  const citySlug = raw.city ?? "";
  const tagSlug = raw.tag ?? "";
  const sort = raw.sort ?? "newest";
  const view = raw.view === "map" ? "map" : "list";
  const page = Math.max(1, parseInt(raw.page ?? "1", 10));
  const maxPrice = raw.maxprice ?? "";

  const activeFeatures = new Set(
    FEATURE_FILTERS.filter((f) => raw[f.param] === "1").map((f) => f.param)
  );

  const supabase = createAdminClient();

  const [{ data: prefectures }, { data: tags }] = await Promise.all([
    supabase.from("prefectures").select("id, name, slug").order("sort_order"),
    supabase.from("tags").select("id, name, slug").order("sort_order"),
  ]);

  const selectedPref = prefectures?.find((p: any) => p.slug === prefSlug) ?? null;

  let cities: any[] = [];
  if (selectedPref) {
    const { data } = await supabase
      .from("cities")
      .select("id, name, slug")
      .eq("prefecture_id", selectedPref.id)
      .order("sort_order");
    cities = data ?? [];
  }
  const selectedCity = cities.find((c: any) => c.slug === citySlug) ?? null;
  const selectedTag = tags?.find((t: any) => t.slug === tagSlug) ?? null;

  let tagGymIds: string[] | null = null;
  if (selectedTag) {
    const { data: gymTags } = await supabase
      .from("gym_tags")
      .select("gym_id")
      .eq("tag_id", selectedTag.id);
    tagGymIds = gymTags?.map((gt: any) => gt.gym_id) ?? [];
  }

  function applyFilters(q: any) {
    if (raw.q) q = q.ilike("name", `%${raw.q.trim()}%`);
    if (selectedPref) q = q.eq("prefecture_id", selectedPref.id);
    if (selectedCity) q = q.eq("city_id", selectedCity.id);
    if (tagGymIds !== null) {
      q = tagGymIds.length === 0
        ? q.eq("id", "00000000-0000-0000-0000-000000000000")
        : q.in("id", tagGymIds);
    }
    for (const f of FEATURE_FILTERS) {
      if (activeFeatures.has(f.param)) q = q.eq(f.col, true);
    }
    if (maxPrice) q = q.lte("monthly_fee_min", parseInt(maxPrice, 10));
    return q;
  }

  function applySort(q: any) {
    if (sort === "price_asc") return q.order("monthly_fee_min", { ascending: true, nullsFirst: false });
    if (sort === "rating") return q.order("google_rating", { ascending: false, nullsFirst: false });
    return q.order("published_at", { ascending: false, nullsFirst: false });
  }

  const from = (page - 1) * PER_PAGE;
  const baseQuery = applyFilters(
    supabase.from("gyms").select(GYM_LIST_SELECT, { count: "exact" }).eq("status", "published")
  );
  const { data: gyms, count } = await applySort(baseQuery).range(from, from + PER_PAGE - 1);
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  // Fetch coordinates for map view (up to 200 gyms, no pagination)
  let mapPins: GymPin[] = [];
  if (view === "map") {
    const mapQuery = applyFilters(
      supabase.from("gyms").select("slug, name, address, monthly_fee_min, latitude, longitude").eq("status", "published")
    );
    const { data: mapGyms } = await mapQuery.not("latitude", "is", null).limit(200);
    mapPins = (mapGyms ?? []).map((g: any) => ({
      slug: g.slug,
      name: g.name,
      address: g.address,
      monthly_fee_min: g.monthly_fee_min,
      lat: g.latitude,
      lng: g.longitude,
    }));
  }

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (prefSlug) baseParams.set("pref", prefSlug);
  if (citySlug) baseParams.set("city", citySlug);
  if (tagSlug) baseParams.set("tag", tagSlug);
  if (sort !== "newest") baseParams.set("sort", sort);
  if (maxPrice) baseParams.set("maxprice", maxPrice);
  for (const f of FEATURE_FILTERS) {
    if (activeFeatures.has(f.param)) baseParams.set(f.param, "1");
  }

  const headingParts: string[] = [];
  if (selectedCity) headingParts.push(selectedCity.name);
  else if (selectedPref) headingParts.push(selectedPref.name);
  if (selectedTag) headingParts.push(selectedTag.name);
  if (q) headingParts.push(`「${q}」`);
  const heading =
    headingParts.length > 0
      ? `${headingParts.join(" · ")}のパーソナルジム`
      : "東海エリアのパーソナルジム";

  function filterLink(label: string, active: boolean, href: string) {
    return (
      <Link
        href={href}
        style={{
          display: "block",
          fontSize: "0.8125rem",
          padding: "0.1875rem 0",
          color: active ? "var(--color-gray-900)" : "var(--color-link)",
          fontWeight: active ? 700 : 400,
          textDecoration: "none",
        }}
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "2.5rem" }}>
      <Breadcrumb items={[{ label: "トップ", href: "/" }, { label: "ジムを探す" }]} />

      <div className="search-layout" style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
        {/* ─── サイドバー ─── */}
        <aside
          className="search-sidebar"
          style={{
            width: "188px",
            flexShrink: 0,
            fontSize: "0.8125rem",
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            position: "sticky",
            top: "1rem",
          }}
        >
          {/* キーワード */}
          <div className="filter-section">
            <p className="filter-section__title">キーワード</p>
            <form method="get" action="/search">
              {prefSlug && <input type="hidden" name="pref" value={prefSlug} />}
              {citySlug && <input type="hidden" name="city" value={citySlug} />}
              {tagSlug && <input type="hidden" name="tag" value={tagSlug} />}
              {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
              {maxPrice && <input type="hidden" name="maxprice" value={maxPrice} />}
              {Array.from(activeFeatures).map((f) => (
                <input key={f} type="hidden" name={f} value="1" />
              ))}
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="ジム名"
                  className="form-input"
                  style={{ padding: "0.3125rem 0.5rem", fontSize: "0.8125rem" }}
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  検索
                </button>
              </div>
            </form>
          </div>

          {/* 都道府県 */}
          <div className="filter-section">
            <p className="filter-section__title">都道府県</p>
            {filterLink("すべて", !prefSlug, buildUrl(baseParams, { pref: null, city: null }))}
            {prefectures?.map((pref: any) =>
              filterLink(
                pref.name,
                prefSlug === pref.slug,
                buildUrl(baseParams, { pref: pref.slug, city: null })
              )
            )}
          </div>

          {/* 市区町村 */}
          {cities.length > 0 && (
            <div className="filter-section">
              <p className="filter-section__title">市区町村</p>
              {filterLink("すべて", !citySlug, buildUrl(baseParams, { city: null }))}
              {cities.map((city: any) =>
                filterLink(
                  city.name,
                  citySlug === city.slug,
                  buildUrl(baseParams, { city: city.slug })
                )
              )}
            </div>
          )}

          {/* こだわり条件 */}
          <div className="filter-section">
            <p className="filter-section__title">こだわり条件</p>
            {FEATURE_FILTERS.map((f) => {
              const active = activeFeatures.has(f.param);
              return filterLink(
                active ? `[選択中] ${f.label}` : f.label,
                active,
                buildUrl(baseParams, { [f.param]: active ? null : "1" })
              );
            })}
          </div>

          {/* 月額料金 */}
          <div className="filter-section">
            <p className="filter-section__title">月額料金（上限）</p>
            {PRICE_OPTIONS.map((opt) =>
              filterLink(
                opt.label,
                maxPrice === opt.value,
                buildUrl(baseParams, { maxprice: opt.value || null })
              )
            )}
          </div>

          {/* タグ */}
          {tags && tags.length > 0 && (
            <div className="filter-section">
              <p className="filter-section__title">特徴タグ</p>
              {tagSlug && filterLink("× 解除", false, buildUrl(baseParams, { tag: null }))}
              {tags.map((tag: any) =>
                filterLink(
                  tag.name,
                  tagSlug === tag.slug,
                  buildUrl(baseParams, { tag: tagSlug === tag.slug ? null : tag.slug })
                )
              )}
            </div>
          )}
        </aside>

        {/* ─── メイン ─── */}
        <div className="search-main" style={{ flex: 1, minWidth: 0 }}>
          {/* ヘッダー行 */}
          <div
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1.25rem",
              marginBottom: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-gray-900)", margin: 0, lineHeight: 1.3 }}>
              {heading}
              <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-gray-500)", marginLeft: "0.5rem" }}>
                {count ?? 0}件
              </span>
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
              {/* リスト/地図 切り替え */}
              <div style={{ display: "flex", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                <Link
                  href={buildUrl(baseParams, { view: null })}
                  style={{
                    display: "block",
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.8125rem",
                    textDecoration: "none",
                    backgroundColor: view === "list" ? "var(--color-gray-900)" : "transparent",
                    color: view === "list" ? "var(--color-white)" : "var(--color-gray-700)",
                  }}
                >
                  リスト
                </Link>
                <Link
                  href={buildUrl(baseParams, { view: "map" })}
                  style={{
                    display: "block",
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.8125rem",
                    textDecoration: "none",
                    borderLeft: "1px solid var(--color-gray-300)",
                    backgroundColor: view === "map" ? "var(--color-gray-900)" : "transparent",
                    color: view === "map" ? "var(--color-white)" : "var(--color-gray-700)",
                  }}
                >
                  地図
                </Link>
              </div>

              {/* 並び順（リストのみ） */}
              {view === "list" && (
                <form method="get" action="/search" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  {q && <input type="hidden" name="q" value={q} />}
                  {prefSlug && <input type="hidden" name="pref" value={prefSlug} />}
                  {citySlug && <input type="hidden" name="city" value={citySlug} />}
                  {tagSlug && <input type="hidden" name="tag" value={tagSlug} />}
                  {maxPrice && <input type="hidden" name="maxprice" value={maxPrice} />}
                  {Array.from(activeFeatures).map((f) => (
                    <input key={f} type="hidden" name={f} value="1" />
                  ))}
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", whiteSpace: "nowrap" }}>
                    並び順:
                  </span>
                  <select
                    name="sort"
                    defaultValue={sort}
                    className="form-input"
                    style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8125rem" }}
                  >
                    <option value="newest">新着順</option>
                    <option value="price_asc">料金が安い順</option>
                    <option value="rating">評価が高い順</option>
                  </select>
                  <button type="submit" className="btn btn-secondary btn-sm">
                    変更
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ─── 地図ビュー ─── */}
          {view === "map" && (
            <div style={{ marginBottom: "1rem" }}>
              {mapPins.length > 0 ? (
                <GymMap gyms={mapPins} />
              ) : (
                <div
                  style={{
                    height: "520px",
                    backgroundColor: "var(--color-white)",
                    border: "1px solid var(--color-gray-200)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-gray-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  地図上に表示できるジムがありません（座標データ未登録）
                </div>
              )}
            </div>
          )}

          {/* ─── リストビュー ─── */}
          {view === "list" && (
            <>
              {gyms && gyms.length > 0 ? (
                <>
                  {gyms.map((gym: any) => (
                    <GymListItem key={gym.slug} gym={toGymSummary(gym)} />
                  ))}
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    buildHref={(p) => {
                      const np = new URLSearchParams(baseParams);
                      if (sort !== "newest") np.set("sort", sort);
                      np.set("page", String(p));
                      return `/search?${np.toString()}`;
                    }}
                  />
                </>
              ) : (
                <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", paddingTop: "2rem" }}>
                  条件に一致するジムが見つかりませんでした。
                </p>
              )}
            </>
          )}

          {/* 地図ビューのときも件数下部に小さく表示 */}
          {view === "map" && gyms && gyms.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "0.5rem" }}>
                リスト表示（{count ?? 0}件中 {gyms.length}件）
              </p>
              {gyms.map((gym: any) => (
                <GymListItem key={gym.slug} gym={toGymSummary(gym)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

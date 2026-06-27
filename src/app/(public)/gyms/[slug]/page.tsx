import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { GymListItem } from "@/components/gym/GymListItem";
import { GYM_LIST_SELECT, toGymSummary, nearestStationInfo } from "@/lib/gym-query";
import { renderMarkdown, stripMarkdownToPlainText } from "@/lib/markdown";
import { TrainIcon } from "@/components/ui/Icons";

export const revalidate = 3600;

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("gyms")
    .select("slug")
    .eq("status", "published");
  return (data ?? []).map((g: any) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: gym } = await supabase
    .from("gyms")
    .select("name, seo_title, meta_description")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!gym) return {};
  const title = gym.seo_title ?? `${gym.name} | パーソナルジム詳細`;
  return {
    title,
    description: gym.meta_description,
    alternates: { canonical: `/gyms/${slug}/` },
    openGraph: {
      title,
      description: gym.meta_description ?? undefined,
      url: `/gyms/${slug}/`,
      type: "website",
    },
  };
}

export default async function GymDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: gym } = await supabase
    .from("gyms")
    .select(`
      id, slug, name, address, area_name, phone, website_url, google_maps_url,
      monthly_fee_min, total_price_min, admission_fee,
      has_trial, trial_fee,
      description, recommended_points, target_users, trainer_info, facilities,
      has_nutrition_support, has_private_room, is_female_friendly, supports_contest, is_near_station,
      google_rating, google_review_count,
      prefecture_id, city_id, latitude, longitude,
      prefectures:prefectures(name, slug),
      cities:cities(name, slug),
      stations(name, latitude, longitude)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!gym) notFound();

  const [{ data: plans }, { data: images }, { data: gymTags }] = await Promise.all([
    supabase.from("gym_plans").select("*").eq("gym_id", gym.id).order("sort_order"),
    supabase.from("gym_images").select("id, image_url, sort_order").eq("gym_id", gym.id).order("sort_order"),
    supabase
      .from("gym_tags")
      .select("tags(name, slug)")
      .eq("gym_id", gym.id),
  ]);

  const [
    { content: descriptionContent },
    { content: recommendedPointsContent },
    { content: targetUsersContent },
    { content: trainerInfoContent },
    { content: facilitiesContent },
  ] = await Promise.all([
    renderMarkdown(gym.description),
    renderMarkdown(gym.recommended_points),
    renderMarkdown(gym.target_users),
    renderMarkdown(gym.trainer_info),
    renderMarkdown(gym.facilities),
  ]);

  const coverImage = images?.[0] ?? null;
  const otherImages = images?.filter((i: any) => i.id !== coverImage?.id) ?? [];
  const pref = gym.prefectures as any;
  const city = gym.cities as any;
  const nearestStation = nearestStationInfo(gym);
  const tags = gymTags?.map((gt: any) => gt.tags).filter(Boolean) ?? [];

  const relatedAreaFilter = gym.city_id
    ? supabase.from("gyms").select(GYM_LIST_SELECT).eq("status", "published").eq("city_id", gym.city_id).neq("id", gym.id).limit(4)
    : gym.prefecture_id
      ? supabase.from("gyms").select(GYM_LIST_SELECT).eq("status", "published").eq("prefecture_id", gym.prefecture_id).neq("id", gym.id).limit(4)
      : null;

  const [{ data: relatedGyms }, { data: featureRows }, { data: rankingRows }] = await Promise.all([
    relatedAreaFilter ?? Promise.resolve({ data: [] as any[] }),
    supabase.from("feature_gyms").select("features(title, slug, status)").eq("gym_id", gym.id),
    supabase.from("ranking_gyms").select("rank, rankings(title, slug, status)").eq("gym_id", gym.id),
  ]);

  const linkedFeatures = (featureRows ?? [])
    .map((r: any) => r.features)
    .filter((f: any) => f?.status === "published");
  const linkedRankings = (rankingRows ?? [])
    .filter((r: any) => r.rankings?.status === "published")
    .map((r: any) => ({ ...r.rankings, rank: r.rank }));

  const featureMap = [
    { label: "体験あり", value: gym.has_trial },
    { label: "女性向け", value: gym.is_female_friendly },
    { label: "完全個室", value: gym.has_private_room },
    { label: "食事指導", value: gym.has_nutrition_support },
    { label: "コンテスト対応", value: gym.supports_contest },
    { label: "駅近", value: gym.is_near_station },
  ].filter((f) => f.value);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "トップ", item: `${siteUrl}/` },
    ...(pref ? [{ "@type": "ListItem", position: 2, name: `${pref.name}のパーソナルジム`, item: `${siteUrl}/${pref.slug}/` }] : []),
    ...(city && pref ? [{ "@type": "ListItem", position: 3, name: `${city.name}のパーソナルジム`, item: `${siteUrl}/${pref.slug}/${city.slug}/` }] : []),
    { "@type": "ListItem", position: (pref ? 1 : 0) + (city && pref ? 1 : 0) + 2, name: gym.name, item: `${siteUrl}/gyms/${gym.slug}/` },
  ];

  const localBusinessLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: gym.name,
    url: gym.website_url ?? `${siteUrl}/gyms/${gym.slug}/`,
    ...(gym.address ? { address: { "@type": "PostalAddress", addressCountry: "JP", streetAddress: gym.address } } : {}),
    ...(gym.phone ? { telephone: gym.phone } : {}),
    ...(gym.description ? { description: stripMarkdownToPlainText(gym.description) } : {}),
    ...(coverImage ? { image: coverImage.image_url } : {}),
    ...(gym.google_rating != null ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: gym.google_rating,
        reviewCount: gym.google_review_count ?? 1,
      },
    } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "2.5rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* パンくず */}
      <Breadcrumb
        items={[
          { label: "トップ", href: "/" },
          ...(pref ? [{ label: `${pref.name}のパーソナルジム`, href: `/${pref.slug}/` }] : []),
          ...(city && pref ? [{ label: `${city.name}のパーソナルジム`, href: `/${pref.slug}/${city.slug}/` }] : []),
          { label: gym.name },
        ]}
      />

      {/* 店舗名・エリア */}
      <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>
        {gym.name}
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-600)", marginBottom: "0.25rem" }}>
        {[gym.area_name, gym.address].filter(Boolean).join(" / ")}
      </p>
      {nearestStation && (
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-gray-600)",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <TrainIcon size={14} style={{ color: "var(--color-gray-400)", flexShrink: 0 }} />
          {nearestStation.name}駅 徒歩{nearestStation.walkMinutes}分
        </p>
      )}

      <div className="gym-detail-layout" style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
        {/* ─── メインカラム ─── */}
        <div
          className="gym-detail-main"
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem 1.5rem",
          }}
        >
          {/* カバー画像 */}
          {coverImage && (
            <div style={{ marginBottom: "1rem" }}>
              <Image
                src={coverImage.image_url}
                alt={gym.name}
                width={760}
                height={480}
                style={{ width: "100%", height: "auto", maxHeight: "380px", objectFit: "cover", borderRadius: "var(--radius-md)" }}
                unoptimized
                priority
              />
            </div>
          )}

          {/* サブ画像 */}
          {otherImages.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {otherImages.slice(0, 5).map((img: any) => (
                <Image
                  key={img.id}
                  src={img.image_url}
                  alt={gym.name}
                  width={140}
                  height={100}
                  style={{ width: "140px", height: "100px", objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                  unoptimized
                />
              ))}
            </div>
          )}

          {/* Googleレビュー */}
          {gym.google_rating != null && (
            <p style={{ fontSize: "0.875rem", color: "var(--color-gray-700)", marginBottom: "1rem" }}>
              Google評価:{" "}
              <span style={{ color: "#B45309", fontWeight: 700 }}>
                {gym.google_rating.toFixed(1)}
              </span>
              <span style={{ color: "var(--color-gray-400)", marginLeft: "0.25rem" }}>
                ({gym.google_review_count?.toLocaleString()}件)
              </span>
            </p>
          )}

          {/* 特徴タグ */}
          {(featureMap.length > 0 || tags.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1.5rem" }}>
              {featureMap.map((f) => (
                <span key={f.label} className="badge badge-green">
                  {f.label}
                </span>
              ))}
              {tags.map((tag: any) => (
                <Link
                  key={tag.slug}
                  href={`/search?tag=${tag.slug}`}
                  className="badge badge-blue"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* 店舗説明 */}
          {descriptionContent && (
            <section className="markdown-body" style={{ marginBottom: "1.75rem" }}>
              <h2 className="section-title">店舗紹介</h2>
              {descriptionContent}
            </section>
          )}

          {/* おすすめポイント */}
          {recommendedPointsContent && (
            <section className="markdown-body" style={{ marginBottom: "1.75rem" }}>
              <h2 className="section-title">おすすめポイント</h2>
              {recommendedPointsContent}
            </section>
          )}

          {/* こんな方に */}
          {targetUsersContent && (
            <section className="markdown-body" style={{ marginBottom: "1.75rem" }}>
              <h2 className="section-title">こんな方におすすめ</h2>
              {targetUsersContent}
            </section>
          )}

          {/* トレーナー情報 */}
          {trainerInfoContent && (
            <section className="markdown-body" style={{ marginBottom: "1.75rem" }}>
              <h2 className="section-title">トレーナー情報</h2>
              {trainerInfoContent}
            </section>
          )}

          {/* 設備・施設 */}
          {facilitiesContent && (
            <section className="markdown-body" style={{ marginBottom: "1.75rem" }}>
              <h2 className="section-title">設備・施設</h2>
              {facilitiesContent}
            </section>
          )}

          {/* 料金プラン */}
          {plans && plans.length > 0 && (
            <section style={{ marginBottom: "1.75rem" }}>
              <h2 className="section-title">料金プラン</h2>
              <div
                className="gym-plan-table-wrap"
                style={{
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                }}
              >
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>プラン名</th>
                      <th>回数</th>
                      <th>期間</th>
                      <th>税込総額</th>
                      <th>月額換算</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan: any) => (
                      <tr key={plan.id}>
                        <td style={{ fontWeight: 600 }}>{plan.name}</td>
                        <td>{plan.sessions != null ? `${plan.sessions}回` : "—"}</td>
                        <td>{plan.duration_weeks != null ? `${plan.duration_weeks}週` : "—"}</td>
                        <td style={{ fontWeight: 700 }}>¥{plan.price.toLocaleString()}</td>
                        <td>
                          {plan.monthly_equivalent != null
                            ? `¥${plan.monthly_equivalent.toLocaleString()}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {gym.admission_fee != null && (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", marginTop: "0.5rem" }}>
                  ※ 入会金 ¥{gym.admission_fee.toLocaleString()} が別途かかる場合があります。
                </p>
              )}
            </section>
          )}

          {/* 基本情報 */}
          <section style={{ marginBottom: "1.75rem" }}>
            <h2 className="section-title">基本情報</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
              }}
            >
              <tbody>
                {[
                  { label: "住所", value: gym.address },
                  { label: "電話", value: gym.phone },
                  { label: "体験レッスン", value: gym.has_trial ? (gym.trial_fee != null ? `あり（¥${gym.trial_fee.toLocaleString()}）` : "あり") : "なし" },
                  { label: "入会金", value: gym.admission_fee != null ? `¥${gym.admission_fee.toLocaleString()}` : null },
                ].filter((r) => r.value != null).map((row) => (
                  <tr key={row.label} style={{ borderBottom: "1px solid var(--color-gray-200)" }}>
                    <th
                      style={{
                        padding: "0.625rem 0.75rem",
                        backgroundColor: "var(--color-gray-50)",
                        color: "var(--color-gray-700)",
                        fontWeight: 600,
                        width: "8rem",
                        textAlign: "left",
                        verticalAlign: "top",
                      }}
                    >
                      {row.label}
                    </th>
                    <td style={{ padding: "0.625rem 0.75rem" }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* ─── サイドバー ─── */}
        <aside
          className="gym-detail-sidebar"
          style={{
            width: "220px",
            flexShrink: 0,
            position: "sticky",
            top: "1rem",
          }}
        >
          {/* 料金 */}
          <div
            style={{
              border: "1px solid var(--color-gray-200)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              marginBottom: "0.75rem",
              backgroundColor: "var(--color-white)",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem" }}>
              月額換算
            </p>
            <p style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.625rem" }}>
              {gym.monthly_fee_min != null
                ? `¥${gym.monthly_fee_min.toLocaleString()}〜`
                : "要問合せ"}
            </p>

            {gym.has_trial && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-success)", fontWeight: 600, marginBottom: "0.75rem" }}>
                体験レッスンあり
                {gym.trial_fee != null ? `（¥${gym.trial_fee.toLocaleString()}）` : ""}
              </p>
            )}

            {gym.website_url && (
              <a
                href={gym.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: "0.5rem", display: "flex" }}
              >
                公式サイトへ
              </a>
            )}

            {gym.google_maps_url && (
              <a
                href={gym.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%", display: "flex" }}
              >
                地図で見る
              </a>
            )}
          </div>

          {/* 電話 */}
          {gym.phone && (
            <div
              style={{
                border: "1px solid var(--color-gray-200)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
                marginBottom: "0.75rem",
                backgroundColor: "var(--color-white)",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.125rem" }}>
                電話番号
              </p>
              <a
                href={`tel:${gym.phone}`}
                style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-gray-900)", textDecoration: "none" }}
              >
                {gym.phone}
              </a>
            </div>
          )}

          {/* 情報修正・申請リンク */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <Link
              href={`/gyms/${gym.slug}/update-request/`}
              style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}
            >
              情報の修正を依頼する
            </Link>
            <Link
              href={`/gyms/${gym.slug}/claim/`}
              style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}
            >
              この店舗の管理者の方へ
            </Link>
            <Link
              href={`/gyms/${gym.slug}/delete-request/`}
              style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}
            >
              掲載の削除を依頼する
            </Link>
          </div>
        </aside>
      </div>

      {(linkedFeatures.length > 0 || linkedRankings.length > 0) && (
        <section style={{ marginTop: "2rem" }}>
          <h2 className="section-title">この店舗が掲載されている特集・ランキング</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {linkedRankings.map((r: any) => (
              <Link key={r.slug} href={`/rankings/${r.slug}/`} className="badge badge-blue" style={{ fontSize: "0.8125rem", padding: "0.4375rem 0.875rem" }}>
                {r.title}（{r.rank}位）
              </Link>
            ))}
            {linkedFeatures.map((f: any) => (
              <Link key={f.slug} href={`/features/${f.slug}/`} className="badge badge-gray" style={{ fontSize: "0.8125rem", padding: "0.4375rem 0.875rem" }}>
                {f.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {relatedGyms && relatedGyms.length > 0 && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2 className="section-title">近くのパーソナルジム</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {relatedGyms.map((g: any) => (
              <GymListItem key={g.id} gym={toGymSummary(g)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

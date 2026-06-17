import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { HeroSearchCard } from "@/components/search/HeroSearchCard";
import { GymListItem } from "@/components/gym/GymListItem";
import { GYM_LIST_SELECT, toGymSummary } from "@/lib/gym-query";
import {
  ChevronRightIcon,
  StarIcon,
  MapPinIcon,
  UsersIcon,
  LockClosedIcon,
  ClipboardListIcon,
  TrophyIcon,
  TrainIcon,
  CalendarIcon,
  SparklesIcon,
  CurrencyYenIcon,
} from "@/components/ui/Icons";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "FitBase - 東海エリアのパーソナルジム検索・比較",
    description: "愛知・岐阜・三重・静岡のパーソナルジムを比較・検索。料金・特徴・エリアで絞り込めるジム情報メディア。",
    url: "/",
    type: "website",
  },
};

const PREF_DATA = [
  {
    slug: "aichi",
    name: "愛知県",
    kana: "Aichi",
    catch: "名古屋・豊橋・岡崎・豊田エリア",
    cities: [
      { name: "名古屋市", slug: "nagoya" },
      { name: "豊橋市", slug: "toyohashi" },
      { name: "岡崎市", slug: "okazaki" },
      { name: "豊田市", slug: "toyota" },
      { name: "一宮市", slug: "ichinomiya" },
      { name: "春日井市", slug: "kasugai" },
    ],
  },
  {
    slug: "gifu",
    name: "岐阜県",
    kana: "Gifu",
    catch: "岐阜・大垣・各務原エリア",
    cities: [
      { name: "岐阜市", slug: "gifu" },
      { name: "大垣市", slug: "ogaki" },
      { name: "各務原市", slug: "kakamigahara" },
      { name: "高山市", slug: "takayama" },
      { name: "多治見市", slug: "tajimi" },
    ],
  },
  {
    slug: "mie",
    name: "三重県",
    kana: "Mie",
    catch: "津・四日市・鈴鹿・伊勢エリア",
    cities: [
      { name: "津市", slug: "tsu" },
      { name: "四日市市", slug: "yokkaichi" },
      { name: "鈴鹿市", slug: "suzuka" },
      { name: "松阪市", slug: "matsusaka" },
      { name: "伊勢市", slug: "ise" },
    ],
  },
  {
    slug: "shizuoka",
    name: "静岡県",
    kana: "Shizuoka",
    catch: "静岡・浜松・沼津・富士エリア",
    cities: [
      { name: "静岡市", slug: "shizuoka" },
      { name: "浜松市", slug: "hamamatsu" },
      { name: "沼津市", slug: "numazu" },
      { name: "富士市", slug: "fuji" },
      { name: "磐田市", slug: "iwata" },
    ],
  },
];

const FEATURE_ITEMS = [
  { icon: CurrencyYenIcon, label: "料金が安いジム", href: "/search?sort=price_asc", color: "#B45309", bg: "#FEF3C7" },
  { icon: UsersIcon, label: "女性向け・女性専用", href: "/search?tag=female-friendly", color: "#DB2777", bg: "#FCE7F3" },
  { icon: LockClosedIcon, label: "完全個室トレーニング", href: "/search?tag=private-room", color: "#6D28D9", bg: "#EDE9FE" },
  { icon: ClipboardListIcon, label: "食事指導・栄養管理", href: "/search?tag=nutrition", color: "#047857", bg: "#D1FAE5" },
  { icon: TrophyIcon, label: "コンテスト・大会対応", href: "/search?tag=contest", color: "#92400E", bg: "#FEF3C7" },
  { icon: TrainIcon, label: "駅近（徒歩5分以内）", href: "/search?tag=near-station", color: "#0369A1", bg: "#E0F2FE" },
  { icon: CalendarIcon, label: "体験レッスンあり", href: "/search?tag=trial", color: "#15803D", bg: "#DCFCE7" },
  { icon: SparklesIcon, label: "評価・口コミが高い", href: "/search?sort=rating", color: "#7C3AED", bg: "#F3E8FF" },
];

function SectionHeading({
  title,
  href,
  hrefLabel,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.25rem",
      }}
    >
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "#111827",
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "4px",
            height: "1.25em",
            backgroundColor: "#D6FF38",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.8125rem",
            color: "#1558D6",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {hrefLabel ?? "すべて見る"}
          <ChevronRightIcon size={13} />
        </Link>
      )}
    </div>
  );
}

/* ── サンプルデータ（デザイン確認用・確認後削除）── */
const SAMPLE_RANKING_GYMS = [
  { slug: "rank-1", name: "RISE GYM 名古屋栄店", area_name: "名古屋市中区", monthly_fee_min: 39800, has_trial: true, is_female_friendly: false, has_private_room: true, has_nutrition_support: true, supports_contest: false, google_rating: 4.9, google_review_count: 214, image_url: null, address: null, total_price_min: null },
  { slug: "rank-2", name: "Body Make Studio TOREMO", area_name: "名古屋市千種区", monthly_fee_min: 29800, has_trial: true, is_female_friendly: true, has_private_room: false, has_nutrition_support: true, supports_contest: false, google_rating: 4.8, google_review_count: 138, image_url: null, address: null, total_price_min: null },
  { slug: "rank-3", name: "PERSONAL GYM EXCEED 岐阜店", area_name: "岐阜市", monthly_fee_min: 34800, has_trial: false, is_female_friendly: true, has_private_room: true, has_nutrition_support: false, supports_contest: true, google_rating: 4.7, google_review_count: 96, image_url: null, address: null, total_price_min: null },
  { slug: "rank-4", name: "FitLab 浜松店", area_name: "浜松市中央区", monthly_fee_min: 32800, has_trial: true, is_female_friendly: false, has_private_room: false, has_nutrition_support: true, supports_contest: false, google_rating: 4.6, google_review_count: 77, image_url: null, address: null, total_price_min: null },
  { slug: "rank-5", name: "TRANSFORM 四日市店", area_name: "四日市市", monthly_fee_min: 28000, has_trial: true, is_female_friendly: true, has_private_room: false, has_nutrition_support: false, supports_contest: false, google_rating: 4.5, google_review_count: 61, image_url: null, address: null, total_price_min: null },
];

const SAMPLE_FEATURED_GYMS = [
  {
    slug: "sample-1",
    name: "RISE GYM 名古屋栄店",
    area_name: "名古屋市中区",
    address: "愛知県名古屋市中区栄3-1-1",
    monthly_fee_min: 39800,
    total_price_min: 119800,
    has_trial: true,
    is_female_friendly: false,
    has_private_room: true,
    has_nutrition_support: true,
    supports_contest: false,
    google_rating: 4.8,
    google_review_count: 124,
    image_url: null,
  },
  {
    slug: "sample-2",
    name: "Body Make Studio TOREMO",
    area_name: "名古屋市千種区",
    address: "愛知県名古屋市千種区今池1-2-3",
    monthly_fee_min: 29800,
    total_price_min: 89800,
    has_trial: true,
    is_female_friendly: true,
    has_private_room: false,
    has_nutrition_support: true,
    supports_contest: false,
    google_rating: 4.6,
    google_review_count: 87,
    image_url: null,
  },
  {
    slug: "sample-3",
    name: "PERSONAL GYM EXCEED 岐阜店",
    area_name: "岐阜市",
    address: "岐阜県岐阜市神田町8-4",
    monthly_fee_min: 34800,
    total_price_min: 104800,
    has_trial: false,
    is_female_friendly: true,
    has_private_room: true,
    has_nutrition_support: false,
    supports_contest: true,
    google_rating: 4.5,
    google_review_count: 62,
    image_url: null,
  },
];

export default async function TopPage() {
  const supabase = createAdminClient();

  const [{ data: featuredGyms }, { data: newGyms }, { data: rankingGyms }, { data: prefectures }] = await Promise.all([
    supabase
      .from("gyms")
      .select(GYM_LIST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(3),
    supabase
      .from("gyms")
      .select(GYM_LIST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from("gyms")
      .select(GYM_LIST_SELECT)
      .eq("status", "published")
      .order("google_rating", { ascending: false, nullsFirst: false })
      .limit(10),
    supabase.from("prefectures").select("slug, name").order("sort_order"),
  ]);

  return (
    <div>
      {/* ════════════════════════════════════════
          HERO — 全幅ダーク＋下部重なり検索カード
      ════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          paddingTop: "5.5rem",
          paddingBottom: "7rem",
          textAlign: "center",
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        {/* ダークオーバーレイ */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(15,23,42,0.82)",
        }} />
        <div className="container" style={{ padding: "0 1.5rem", position: "relative", zIndex: 1 }}>
          <h1
            className="hero-title"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.875rem)",
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
            }}
          >
            東海エリアの<span style={{ color: "#D6FF38" }}>パーソナルジム</span>を、<br className="hero-br" />
            料金・特徴で比較して探す
          </h1>

          <p className="hero-desc" style={{ fontSize: "0.9375rem", color: "#FFFFFF", lineHeight: 1.75, maxWidth: "560px", margin: "0 auto" }}>
            愛知・岐阜・三重・静岡のパーソナルジムを一覧で比較できる専門メディア。<br className="hero-br" />料金・エリア・こだわり条件で絞り込んで、理想のジムを見つけよう。
          </p>
        </div>
      </section>

      {/* ── 検索カード（ヒーローに重なる） ── */}
      <div
        className="container"
        style={{
          marginTop: "-3rem",
          position: "relative",
          zIndex: 10,
          padding: "0 1.5rem",
          marginBottom: "2rem",
        }}
      >
        <HeroSearchCard prefectures={prefectures ?? []} />
      </div>

      {/* ════════════════════════════════════════
          注目のジム（特集）
      ════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "#F4F5F7",
            borderBottom: "1px solid #E5E7EB",
            padding: "2.5rem 0",
          }}
        >
          <div className="container">
            <SectionHeading title="注目のパーソナルジム" href="/search?sort=rating" hrefLabel="すべて見る" />
            <div
              className="grid-featured"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              {(featuredGyms?.length ? featuredGyms : SAMPLE_FEATURED_GYMS).map((g: any) => {
                const gym = toGymSummary(g);
                return (
                  <Link
                    key={gym.slug}
                    href={`/gyms/${gym.slug}/`}
                    style={{ textDecoration: "none", display: "flex" }}
                  >
                    <div
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        transition: "box-shadow 0.15s, transform 0.15s",
                      }}
                      className="card-hover"
                    >
                      {/* 画像 */}
                      <div
                        style={{
                          height: "160px",
                          backgroundColor: "#EAECEF",
                          position: "relative",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {gym.image_url ? (
                          <Image
                            src={gym.image_url}
                            alt={gym.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                              color: "#9CA3AF",
                              fontSize: "0.8125rem",
                            }}
                          >
                            写真準備中
                          </div>
                        )}
                      </div>

                      {/* コンテンツ */}
                      <div style={{ padding: "0.875rem 1rem 1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                        {gym.area_name && (
                          <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: "0 0 0.25rem" }}>
                            {gym.area_name}
                          </p>
                        )}
                        <h3
                          style={{
                            fontSize: "0.9375rem",
                            fontWeight: 700,
                            color: "#111827",
                            margin: "0 0 0.625rem",
                            lineHeight: 1.45,
                          }}
                        >
                          {gym.name}
                        </h3>

                        {/* 評価 */}
                        {gym.google_rating && (
                          <p style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", margin: "0 0 0.375rem", color: "#374151" }}>
                            <StarIcon size={13} style={{ color: "#D97706", flexShrink: 0 }} />
                            <span style={{ fontWeight: 700 }}>{gym.google_rating.toFixed(1)}</span>
                            {gym.google_review_count && (
                              <span style={{ color: "#9CA3AF" }}>({gym.google_review_count.toLocaleString()})</span>
                            )}
                          </p>
                        )}

                        {/* 料金 */}
                        {gym.monthly_fee_min && (
                          <p style={{ fontSize: "0.875rem", color: "#C2410C", fontWeight: 700, margin: "0 0 0.625rem" }}>
                            月額 {gym.monthly_fee_min.toLocaleString()}円〜
                          </p>
                        )}

                        {/* タグ */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "auto" }}>
                          {gym.has_trial && (
                            <span style={{ fontSize: "0.6875rem", color: "#6B7280", backgroundColor: "#F3F4F6", borderRadius: "2px", padding: "0.1875rem 0.5rem" }}>
                              体験あり
                            </span>
                          )}
                          {gym.is_female_friendly && (
                            <span style={{ fontSize: "0.6875rem", color: "#6B7280", backgroundColor: "#F3F4F6", borderRadius: "2px", padding: "0.1875rem 0.5rem" }}>
                              女性歓迎
                            </span>
                          )}
                          {gym.has_private_room && (
                            <span style={{ fontSize: "0.6875rem", color: "#6B7280", backgroundColor: "#F3F4F6", borderRadius: "2px", padding: "0.1875rem 0.5rem" }}>
                              個室あり
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

      {/* ════════════════════════════════════════
          エリアから探す（白）
      ════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          padding: "2.5rem 0",
        }}
      >
        <div className="container">
          <SectionHeading title="エリアから探す" href="/search" hrefLabel="全エリアから検索" />

          {/* SUUMOスタイルの表形式エリアナビ */}
          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            {PREF_DATA.map((pref, idx) => (
              <div
                key={pref.slug}
                className="area-row"
                style={{
                  display: "flex",
                  borderBottom:
                    idx < PREF_DATA.length - 1 ? "1px solid #E5E7EB" : "none",
                  minHeight: "72px",
                }}
              >
                {/* 都道府県列 */}
                <div
                  className="area-pref-col"
                  style={{
                    width: "148px",
                    minWidth: "148px",
                    padding: "1rem 1.25rem",
                    backgroundColor: "#F8FAFC",
                    borderRight: "1px solid #E5E7EB",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "0.25rem",
                  }}
                >
                  <Link
                    href={`/${pref.slug}/`}
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#111827",
                      textDecoration: "none",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.3,
                      display: "block",
                    }}
                  >
                    {pref.name}
                  </Link>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "#9CA3AF",
                      letterSpacing: "0.06em",
                      fontWeight: 500,
                    }}
                  >
                    {pref.kana}
                  </span>
                </div>

                {/* 市区町村列 */}
                <div
                  style={{
                    flex: 1,
                    padding: "0.75rem 0",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {pref.cities.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/${pref.slug}/${city.slug}/`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.375rem 1rem",
                        fontSize: "0.875rem",
                        color: "#1558D6",
                        fontWeight: 500,
                        textDecoration: "none",
                        borderRight: "1px solid #F3F4F6",
                        lineHeight: 1.4,
                      }}
                    >
                      {city.name}
                    </Link>
                  ))}
                  <Link
                    href={`/${pref.slug}/`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.1875rem",
                      padding: "0.375rem 1rem",
                      fontSize: "0.8125rem",
                      color: "#6B7280",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    {pref.name}のジムをすべて見る
                    <ChevronRightIcon size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* 補足テキスト */}
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#9CA3AF",
              marginTop: "0.75rem",
              textAlign: "right",
            }}
          >
            上記以外の市区町村も掲載しています。
            <Link href="/search" style={{ color: "#1558D6", marginLeft: "0.25rem" }}>
              キーワード検索
            </Link>
            からもお探しいただけます。
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
          条件で探す（薄グレー）
      ════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "#F4F5F7",
          borderBottom: "1px solid #E5E7EB",
          padding: "2.5rem 0",
        }}
      >
        <div className="container">
          <SectionHeading title="条件・特徴から探す" href="/search" hrefLabel="すべての条件で検索" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {FEATURE_ITEMS.map(({ icon: Icon, label, href, color, bg }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "1.375rem 1rem 1.125rem",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease",
                }}
                className="card-hover"
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#374151",
                    lineHeight: 1.45,
                  }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          新着ジム（白）
      ════════════════════════════════════════ */}
      <section style={{ backgroundColor: "#FFFFFF", padding: "2.5rem 0" }}>
        <div className="container">
          <SectionHeading title="新着ジム" href="/search" hrefLabel="ジムをすべて見る" />

          {newGyms && newGyms.length > 0 ? (
            <>
              {newGyms.map((gym: any) => (
                <GymListItem key={gym.slug} gym={toGymSummary(gym)} />
              ))}
              <div style={{ textAlign: "center", paddingTop: "1.5rem" }}>
                <Link href="/search" className="btn btn-secondary btn-lg">
                  掲載中のジムをすべて見る
                </Link>
              </div>
            </>
          ) : (
            <div
              style={{
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                padding: "3rem 2rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "0.9375rem", color: "#6B7280", fontWeight: 600 }}>
                現在掲載中のジムがありません
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", marginTop: "0.375rem" }}>
                管理画面からジムを登録・公開してください
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          ランキング（薄グレー）
      ════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "#F4F5F7",
          borderBottom: "1px solid #E5E7EB",
          padding: "2.5rem 0",
        }}
      >
        <div className="container">
          <SectionHeading title="評価ランキング" href="/rankings" hrefLabel="ランキングをすべて見る" />
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            {(rankingGyms?.length ? rankingGyms : SAMPLE_RANKING_GYMS).map((g: any, idx: number) => {
              const gym = toGymSummary(g);
              const rank = idx + 1;
              const total = rankingGyms?.length ?? SAMPLE_RANKING_GYMS.length;

              return (
                <Link
                  key={gym.slug}
                  href={`/gyms/${gym.slug}/`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    padding: "1.125rem 1.5rem",
                    borderBottom: idx < total - 1 ? "1px solid #F3F4F6" : "none",
                    textDecoration: "none",
                    transition: "background-color 0.1s",
                  }}
                  className="ranking-row"
                >
                  {/* 順位アイコン */}
                  {rank <= 3 && (
                    <div style={{ flexShrink: 0, width: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Image
                        src={`/medal-${rank}.png`}
                        alt={`${rank}位`}
                        width={454}
                        height={454}
                        style={{ width: "48px", height: "48px" }}
                      />
                    </div>
                  )}
                  {rank >= 4 && (
                    <div style={{ flexShrink: 0, width: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "#D1D5DB", letterSpacing: "-0.03em" }}>{rank}</span>
                    </div>
                  )}

                  {/* ジム情報 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {gym.area_name && (
                      <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: "0 0 0.2rem", letterSpacing: "0.01em" }}>
                        {gym.area_name}
                      </p>
                    )}
                    <p style={{
                      fontSize: rank <= 3 ? "1rem" : "0.9375rem",
                      fontWeight: 700,
                      color: "#111827",
                      margin: 0,
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {gym.name}
                    </p>
                  </div>

                  {/* 評価 + 料金 */}
                  <div className="ranking-right-col" style={{ flexShrink: 0, textAlign: "right", minWidth: "140px" }}>
                    {gym.google_rating && (
                      <p style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9375rem", margin: "0 0 0.3rem", justifyContent: "flex-end" }}>
                        <StarIcon size={14} style={{ color: "#D97706" }} />
                        <span style={{ fontWeight: 800, color: "#111827" }}>{gym.google_rating.toFixed(1)}</span>
                        {gym.google_review_count && (
                          <span style={{ color: "#9CA3AF", fontSize: "0.8125rem" }}>({gym.google_review_count})</span>
                        )}
                      </p>
                    )}
                    {gym.monthly_fee_min && (
                      <p style={{ fontSize: "0.875rem", color: "#C2410C", fontWeight: 700, margin: 0 }}>
                        月額 {gym.monthly_fee_min.toLocaleString()}円〜
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FitBase について（薄グレー）
      ════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "#F4F5F7",
          borderTop: "1px solid #E5E7EB",
          padding: "2rem 0",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              gap: "0.625rem",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "4px",
                height: "1em",
                backgroundColor: "#D6FF38",
                borderRadius: "2px",
                flexShrink: 0,
                marginTop: "0.25em",
              }}
            />
            <div>
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: "0.375rem",
                }}
              >
                FitBase（フィットベース）とは
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  lineHeight: 1.85,
                  color: "#6B7280",
                  maxWidth: "800px",
                }}
              >
                FitBaseは、愛知・岐阜・三重・静岡（東海4県）のパーソナルジムを専門的に掲載する検索・比較メディアです。
                月額料金・体験レッスン有無・個室対応・女性専用など、ジム選びに必要な情報を一覧で比較できます。
                エリア検索・条件絞り込みで、あなたに最適なパーソナルジムを見つけてください。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

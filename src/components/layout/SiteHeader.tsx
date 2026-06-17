import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "./MobileNav";
import {
  ChevronDownIcon,
  UsersIcon,
  LockClosedIcon,
  ClipboardListIcon,
  TrophyIcon,
  TrainIcon,
  CalendarIcon,
  CurrencyYenIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

const PREF_DATA = [
  {
    slug: "aichi",
    name: "愛知県",
    cities: [
      { name: "名古屋市", slug: "nagoya" },
      { name: "豊橋市", slug: "toyohashi" },
      { name: "岡崎市", slug: "okazaki" },
      { name: "豊田市", slug: "toyota" },
    ],
  },
  {
    slug: "gifu",
    name: "岐阜県",
    cities: [
      { name: "岐阜市", slug: "gifu" },
      { name: "大垣市", slug: "ogaki" },
      { name: "各務原市", slug: "kakamigahara" },
    ],
  },
  {
    slug: "mie",
    name: "三重県",
    cities: [
      { name: "津市", slug: "tsu" },
      { name: "四日市市", slug: "yokkaichi" },
      { name: "鈴鹿市", slug: "suzuka" },
    ],
  },
  {
    slug: "shizuoka",
    name: "静岡県",
    cities: [
      { name: "静岡市", slug: "shizuoka" },
      { name: "浜松市", slug: "hamamatsu" },
      { name: "沼津市", slug: "numazu" },
    ],
  },
];

const CONDITION_ITEMS = [
  { icon: CurrencyYenIcon, label: "料金が安いジム", href: "/search?sort=price_asc" },
  { icon: UsersIcon, label: "女性向け・女性専用", href: "/search?tag=female-friendly" },
  { icon: LockClosedIcon, label: "完全個室トレーニング", href: "/search?tag=private-room" },
  { icon: ClipboardListIcon, label: "食事指導・栄養管理あり", href: "/search?tag=nutrition" },
  { icon: TrophyIcon, label: "コンテスト・大会対応", href: "/search?tag=contest" },
  { icon: TrainIcon, label: "駅近（徒歩5分以内）", href: "/search?tag=near-station" },
  { icon: CalendarIcon, label: "体験レッスンあり", href: "/search?tag=trial" },
  { icon: SparklesIcon, label: "評価・口コミが高い", href: "/search?sort=rating" },
];

export function SiteHeader() {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100 }}>
      {/* アクセントライン */}
      <div
        style={{
          height: "3px",
          background: "linear-gradient(90deg, #D6FF38 0%, #A8D400 100%)",
        }}
      />

      {/* ─── 主ナビ ─── */}
      <div
        className="nav-bar"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          position: "relative", /* ドロップダウンの位置基準 */
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "60px",
          }}
        >
          {/* ロゴ */}
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0, lineHeight: 0 }}>
            <Image
              src="/logo-header-v2.png"
              alt="FitBase"
              width={1350}
              height={440}
              style={{ height: "42px", width: "auto", display: "block" }}
              priority
            />
          </Link>

          {/* ナビゲーション（デスクトップ） */}
          <nav className="nav-desktop" style={{ display: "flex", alignItems: "stretch", height: "60px" }}>
            {/* ジムを探す（メガドロップダウン） */}
            <div className="nav-has-dropdown">
              <Link href="/search">
                ジムを探す
                <ChevronDownIcon size={14} style={{ color: "#9CA3AF" }} />
              </Link>

              {/* ─── メガドロップダウン ─── */}
              <div className="nav-mega">
                {/* エリアから探す */}
                <div style={{ flex: 1 }}>
                  <p className="nav-mega__col-title">エリアから探す</p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem 1.5rem",
                    }}
                  >
                    {PREF_DATA.map((pref) => (
                      <div key={pref.slug}>
                        <Link
                          href={`/${pref.slug}/`}
                          className="nav-mega__pref-link"
                        >
                          {pref.name}
                        </Link>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.125rem 0.5rem",
                          }}
                        >
                          {pref.cities.map((city) => (
                            <Link
                              key={city.slug}
                              href={`/${pref.slug}/${city.slug}/`}
                              className="nav-mega__city-link"
                            >
                              {city.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #F3F4F6" }}>
                    <Link
                      href="/search"
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
                      全エリアからジムを検索する &rsaquo;
                    </Link>
                  </div>
                </div>

                {/* 区切り線 */}
                <div
                  style={{
                    width: "1px",
                    backgroundColor: "#E5E7EB",
                    flexShrink: 0,
                    margin: "0 -0.5rem",
                  }}
                />

                {/* 条件から探す */}
                <div style={{ width: "210px", flexShrink: 0 }}>
                  <p className="nav-mega__col-title">条件から探す</p>
                  <div>
                    {CONDITION_ITEMS.map(({ icon: Icon, label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        className="nav-mega__condition-link"
                      >
                        <Icon
                          size={14}
                          style={{ color: "#9CA3AF", flexShrink: 0 }}
                        />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 特集 */}
            <Link
              href="/features"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "60px",
                padding: "0 1.125rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#374151",
                textDecoration: "none",
                borderLeft: "1px solid #F3F4F6",
                transition: "color 0.1s, background-color 0.1s",
              }}
            >
              特集
            </Link>

            {/* ランキング */}
            <Link
              href="/rankings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "60px",
                padding: "0 1.125rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#374151",
                textDecoration: "none",
                borderLeft: "1px solid #F3F4F6",
                transition: "color 0.1s, background-color 0.1s",
              }}
            >
              ランキング
            </Link>

            {/* コラム */}
            <Link
              href="/articles"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "60px",
                padding: "0 1.125rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#374151",
                textDecoration: "none",
                borderLeft: "1px solid #F3F4F6",
                transition: "color 0.1s, background-color 0.1s",
              }}
            >
              コラム
            </Link>

            {/* 掲載依頼 CTA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: "1rem",
                marginLeft: "0.25rem",
              }}
            >
              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.4375rem 1rem",
                  backgroundColor: "#111827",
                  color: "#FFFFFF",
                  borderRadius: "3px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                掲載を依頼
              </Link>
            </div>
          </nav>

          {/* ハンバーガー（モバイル） */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

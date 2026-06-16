import Image from "next/image";
import Link from "next/link";

const FOOTER_COLS = [
  {
    title: "エリアから探す",
    links: [
      { label: "愛知県のパーソナルジム", href: "/aichi/" },
      { label: "岐阜県のパーソナルジム", href: "/gifu/" },
      { label: "三重県のパーソナルジム", href: "/mie/" },
      { label: "静岡県のパーソナルジム", href: "/shizuoka/" },
      { label: "ジムをすべて検索", href: "/search" },
    ],
  },
  {
    title: "特集・コンテンツ",
    links: [
      { label: "特集一覧", href: "/features" },
      { label: "ランキング", href: "/rankings" },
      { label: "コラム・記事", href: "/articles" },
    ],
  },
  {
    title: "条件で探す",
    links: [
      { label: "安いジムを探す", href: "/search?sort=price_asc" },
      { label: "女性向けジム", href: "/search?tag=female-friendly" },
      { label: "完全個室ジム", href: "/search?tag=private-room" },
      { label: "体験あり", href: "/search?tag=trial" },
      { label: "コンテスト対応", href: "/search?tag=contest" },
    ],
  },
  {
    title: "サイト情報",
    links: [
      { label: "FitBase について", href: "/about" },
      { label: "お問い合わせ", href: "/contact" },
      { label: "プライバシーポリシー", href: "/privacy" },
      { label: "利用規約", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer style={{ marginTop: "3rem" }}>
      {/* ─── メインフッター（ダーク） ─── */}
      <div style={{ backgroundColor: "#111827" }}>
        <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "2rem" }}>
          {/* ロゴ */}
          <div style={{ marginBottom: "2rem" }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              <Image
                src="/logo-footer.png"
                alt="FitBase"
                width={1350}
                height={440}
                style={{ height: "32px", width: "auto" }}
              />
            </Link>
            <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", marginTop: "0.5rem" }}>
              東海エリアのパーソナルジム検索・比較メディア
            </p>
          </div>

          {/* リンクカラム */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "2rem",
              paddingBottom: "2rem",
              borderBottom: "1px solid #374151",
            }}
          >
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "0.75rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {col.title}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        style={{ fontSize: "0.8125rem", color: "#9CA3AF", textDecoration: "none" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 店舗オーナー向け */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid #374151",
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", marginBottom: "0.5rem" }}>
              店舗の方へ
            </p>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <Link href="/contact" style={{ fontSize: "0.8125rem", color: "#D1D5DB" }}>
                新規掲載・お問い合わせ
              </Link>
              <Link href="/contact" style={{ fontSize: "0.8125rem", color: "#D1D5DB" }}>
                掲載情報の修正依頼
              </Link>
              <Link href="/contact" style={{ fontSize: "0.8125rem", color: "#D1D5DB" }}>
                掲載削除依頼
              </Link>
            </div>
          </div>

          {/* コピーライト */}
          <div style={{ paddingTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <p style={{ fontSize: "0.75rem", color: "#6B7280" }}>
              &copy; {new Date().getFullYear()} FitBase. All rights reserved.
            </p>
            <nav style={{ display: "flex", gap: "1.25rem" }}>
              <Link href="/privacy" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                プライバシーポリシー
              </Link>
              <Link href="/terms" style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                利用規約
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

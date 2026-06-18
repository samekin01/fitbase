import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  { label: "ダッシュボード", href: "/admin" },
  { label: "ジム一覧", href: "/admin/gyms" },
  { label: "ジム登録", href: "/admin/gyms/new" },
  { label: "都道府県", href: "/admin/areas/prefectures" },
  { label: "市区町村", href: "/admin/areas/cities" },
  { label: "駅マスタ", href: "/admin/areas/stations" },
  { label: "特集", href: "/admin/features" },
  { label: "ランキング", href: "/admin/rankings" },
  { label: "記事", href: "/admin/articles" },
  { label: "タグ", href: "/admin/tags" },
  { label: "AI一括入力", href: "/admin/gyms/ai-fill" },
  { label: "最寄駅リンク", href: "/admin/gyms/link-stations" },
  { label: "Places 収集", href: "/admin/places/import" },
  { label: "インポート履歴", href: "/admin/places/history" },
  { label: "管理申請", href: "/admin/requests/claims" },
  { label: "修正依頼", href: "/admin/requests/updates" },
  { label: "削除依頼", href: "/admin/requests/deletes" },
  { label: "問い合わせ", href: "/admin/requests/contacts" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  // admin ロール確認
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>管理者権限がありません。</p>
        <LogoutButton className="btn btn-secondary" style={{ marginTop: "1rem" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-gray-50)" }}>
      {/* サイドバー */}
      <aside
        style={{
          width: "200px",
          flexShrink: 0,
          backgroundColor: "var(--color-white)",
          borderRight: "1px solid var(--color-gray-200)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ロゴ */}
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid var(--color-gray-200)",
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "var(--color-gray-900)",
          }}
        >
          FitBase CMS
        </div>

        {/* ナビ */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "0.4375rem 1rem",
                fontSize: "0.8125rem",
                color: "var(--color-gray-700)",
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* フッター */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid var(--color-gray-200)",
            fontSize: "0.75rem",
            color: "var(--color-gray-500)",
          }}
        >
          <p style={{ marginBottom: "0.375rem" }}>{user.email}</p>
          <LogoutButton
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "0.75rem",
              color: "var(--color-link)",
              cursor: "pointer",
            }}
          />
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main style={{ flex: 1, minWidth: 0, padding: "1.5rem", overflowX: "auto" }}>
        {children}
      </main>
    </div>
  );
}

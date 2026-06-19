import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminSidebarNav, type NavGroup } from "@/components/admin/AdminSidebarNav";
import {
  HomeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  InboxIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  const admin = createAdminClient();
  const [{ count: pendingClaims }, { count: pendingUpdates }, { count: pendingDeletes }, { count: unreadContacts }] =
    await Promise.all([
      admin.from("gym_claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("gym_update_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("gym_delete_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("contacts").select("*", { count: "exact", head: true }).eq("status", "unread"),
    ]);
  const pendingRequestsTotal =
    (pendingClaims ?? 0) + (pendingUpdates ?? 0) + (pendingDeletes ?? 0) + (unreadContacts ?? 0);

  const navGroups: NavGroup[] = [
    {
      icon: <HomeIcon size={16} />,
      links: [{ label: "ダッシュボード", href: "/admin" }],
    },
    {
      title: "ジム管理",
      icon: <BuildingOfficeIcon size={13} />,
      links: [
        { label: "ジム一覧", href: "/admin/gyms" },
        { label: "AI一括入力", href: "/admin/gyms/ai-fill" },
        { label: "最寄駅リンク", href: "/admin/gyms/link-stations" },
      ],
    },
    {
      title: "エリア",
      icon: <MapPinIcon size={13} />,
      links: [{ label: "エリアマスタ", href: "/admin/areas" }],
    },
    {
      title: "コンテンツ",
      icon: <DocumentTextIcon size={13} />,
      links: [
        { label: "特集", href: "/admin/features" },
        { label: "ランキング", href: "/admin/rankings" },
        { label: "記事", href: "/admin/articles" },
        { label: "タグ", href: "/admin/tags" },
      ],
    },
    {
      title: "外部連携",
      icon: <GlobeAltIcon size={13} />,
      links: [{ label: "Google Places連携", href: "/admin/places" }],
    },
    {
      title: "申請・問い合わせ",
      icon: <InboxIcon size={13} />,
      links: [{ label: "申請一覧", href: "/admin/requests", badge: pendingRequestsTotal }],
    },
    {
      title: "SEO・分析",
      icon: <ChartBarIcon size={13} />,
      links: [
        { label: "SEO管理", href: "/admin/seo" },
        { label: "アナリティクス", href: "/admin/analytics" },
        { label: "ヒートマップ", href: "/admin/heatmap" },
      ],
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-gray-50)" }}>
      {/* サイドバー */}
      <aside
        style={{
          width: "212px",
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
            padding: "0.875rem 1rem",
            borderBottom: "1px solid var(--color-gray-200)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Image
            src="/logo-header-v2.png"
            alt="FitBase"
            width={1350}
            height={440}
            style={{ height: "26px", width: "auto", display: "block" }}
            priority
          />
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "var(--color-gray-400)",
              letterSpacing: "0.04em",
              border: "1px solid var(--color-gray-200)",
              borderRadius: "3px",
              padding: "0.0625rem 0.3125rem",
            }}
          >
            CMS
          </span>
        </div>

        <AdminSidebarNav groups={navGroups} />

        {/* フッター */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid var(--color-gray-200)",
            fontSize: "0.75rem",
            color: "var(--color-gray-500)",
          }}
        >
          <p style={{ marginBottom: "0.375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
          <LogoutButton
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "0.75rem",
              color: "var(--color-link)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <ArrowRightOnRectangleIcon size={14} />
            ログアウト
          </LogoutButton>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main style={{ flex: 1, minWidth: 0, padding: "1.5rem", overflowX: "auto" }}>
        {children}
      </main>
    </div>
  );
}

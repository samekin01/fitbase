import { createAdminClient } from "@/lib/supabase/admin";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  UsersIcon,
  ClipboardListIcon as UpdateIcon,
  InboxIcon,
} from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "ダッシュボード | FitBase CMS" };

type Stat = {
  label: string;
  value: number;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  bg: string;
};

function StatCard({ stat }: { stat: Stat }) {
  return (
    <a href={stat.href} className="admin-stat-card">
      <span className="admin-stat-card__icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
        <stat.icon size={22} />
      </span>
      <div>
        <p className="admin-stat-card__label">{stat.label}</p>
        <p className="admin-stat-card__value">{stat.value.toLocaleString()}</p>
      </div>
    </a>
  );
}

export default async function DashboardPage() {
  const supabase = createAdminClient();

  const [
    { count: totalGyms },
    { count: publishedGyms },
    { count: draftGyms },
    { count: pendingClaims },
    { count: pendingUpdates },
    { count: pendingDeletes },
    { count: unreadContacts },
  ] = await Promise.all([
    supabase.from("gyms").select("*", { count: "exact", head: true }),
    supabase.from("gyms").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("gyms").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("gym_claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("gym_update_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("gym_delete_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "unread"),
  ]);

  const gymStats: Stat[] = [
    {
      label: "ジム総数",
      value: totalGyms ?? 0,
      href: "/admin/gyms",
      icon: BuildingOfficeIcon,
      color: "var(--color-gray-700)",
      bg: "var(--color-gray-100)",
    },
    {
      label: "公開中",
      value: publishedGyms ?? 0,
      href: "/admin/gyms?status=published",
      icon: CheckCircleIcon,
      color: "var(--color-success)",
      bg: "#DCFCE7",
    },
    {
      label: "下書き",
      value: draftGyms ?? 0,
      href: "/admin/gyms?status=draft",
      icon: ClipboardListIcon,
      color: "var(--color-warning)",
      bg: "#FEF3C7",
    },
  ];

  const requestStats: Stat[] = [
    {
      label: "管理申請（未対応）",
      value: pendingClaims ?? 0,
      href: "/admin/requests/claims",
      icon: UsersIcon,
      color: "var(--color-error)",
      bg: "#FEE2E2",
    },
    {
      label: "修正依頼（未対応）",
      value: pendingUpdates ?? 0,
      href: "/admin/requests/updates",
      icon: UpdateIcon,
      color: "var(--color-error)",
      bg: "#FEE2E2",
    },
    {
      label: "削除依頼（未対応）",
      value: pendingDeletes ?? 0,
      href: "/admin/requests/deletes",
      icon: InboxIcon,
      color: "var(--color-error)",
      bg: "#FEE2E2",
    },
    {
      label: "未読問い合わせ",
      value: unreadContacts ?? 0,
      href: "/admin/requests/contacts",
      icon: InboxIcon,
      color: "var(--color-error)",
      bg: "#FEE2E2",
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        ダッシュボード
      </h1>

      <h2 className="admin-section-title">ジム統計</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {gymStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <h2 className="admin-section-title">対応待ち</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {requestStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  );
}

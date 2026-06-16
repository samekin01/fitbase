import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "ダッシュボード | FitBase CMS" };

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

  const stats = [
    { label: "ジム総数", value: totalGyms ?? 0, href: "/admin/gyms" },
    { label: "公開中", value: publishedGyms ?? 0, href: "/admin/gyms?status=published" },
    { label: "下書き", value: draftGyms ?? 0, href: "/admin/gyms?status=draft" },
    { label: "管理申請（未対応）", value: pendingClaims ?? 0, href: "/admin/requests/claims" },
    { label: "修正依頼（未対応）", value: pendingUpdates ?? 0, href: "/admin/requests/updates" },
    { label: "削除依頼（未対応）", value: pendingDeletes ?? 0, href: "/admin/requests/deletes" },
    { label: "未読問い合わせ", value: unreadContacts ?? 0, href: "/admin/requests/contacts" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        ダッシュボード
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
        {stats.map((stat) => (
          <a
            key={stat.label}
            href={stat.href}
            style={{
              display: "block",
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              textDecoration: "none",
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", marginBottom: "0.375rem" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
              {stat.value}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

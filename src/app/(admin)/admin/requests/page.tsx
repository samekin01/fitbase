import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "申請・問い合わせ | FitBase CMS" };

export default async function RequestsPage() {
  const supabase = createAdminClient();

  const [
    { count: pendingClaims },
    { count: pendingUpdates },
    { count: pendingDeletes },
    { count: unreadContacts },
  ] = await Promise.all([
    supabase.from("gym_claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("gym_update_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("gym_delete_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "unread"),
  ]);

  const items = [
    { label: "掲載管理申請", count: pendingClaims ?? 0, href: "/admin/requests/claims" },
    { label: "情報修正依頼", count: pendingUpdates ?? 0, href: "/admin/requests/updates" },
    { label: "掲載削除依頼", count: pendingDeletes ?? 0, href: "/admin/requests/deletes" },
    { label: "お問い合わせ", count: unreadContacts ?? 0, href: "/admin/requests/contacts" },
  ];

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        申請・問い合わせ
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: "var(--radius-md)",
              padding: "0.875rem 1rem",
              textDecoration: "none",
              color: "var(--color-gray-900)",
            }}
          >
            <span style={{ fontWeight: 500 }}>{item.label}</span>
            {item.count > 0 && (
              <span
                className="badge"
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                }}
              >
                未対応 {item.count}件
              </span>
            )}
            {item.count === 0 && (
              <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-400)" }}>なし</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

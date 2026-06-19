import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersIcon, ClipboardListIcon as UpdateIcon, InboxIcon, ChevronRightIcon } from "@/components/ui/Icons";

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
    {
      label: "掲載管理申請",
      description: "事業者からのジム掲載・管理権限の申請",
      count: pendingClaims ?? 0,
      href: "/admin/requests/claims",
      icon: UsersIcon,
    },
    {
      label: "情報修正依頼",
      description: "掲載情報の修正・変更リクエスト",
      count: pendingUpdates ?? 0,
      href: "/admin/requests/updates",
      icon: UpdateIcon,
    },
    {
      label: "掲載削除依頼",
      description: "掲載の取り下げ・削除リクエスト",
      count: pendingDeletes ?? 0,
      href: "/admin/requests/deletes",
      icon: InboxIcon,
    },
    {
      label: "お問い合わせ",
      description: "サイト経由で届いた一般のお問い合わせ",
      count: unreadContacts ?? 0,
      href: "/admin/requests/contacts",
      icon: InboxIcon,
    },
  ];

  const totalPending = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        申請・問い合わせ
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
        {totalPending > 0 ? `現在 ${totalPending}件の未対応があります。` : "未対応の申請・問い合わせはありません。"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card card-hover"
            style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.125rem", textDecoration: "none" }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: item.count > 0 ? "#FEE2E2" : "var(--color-gray-100)",
                color: item.count > 0 ? "var(--color-error)" : "var(--color-gray-700)",
                flexShrink: 0,
              }}
            >
              <item.icon size={22} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.125rem" }}>{item.label}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>{item.description}</p>
            </div>
            {item.count > 0 ? (
              <span className="badge badge-red" style={{ flexShrink: 0 }}>
                未対応 {item.count}件
              </span>
            ) : (
              <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-400)", flexShrink: 0 }}>なし</span>
            )}
            <ChevronRightIcon size={16} style={{ color: "var(--color-gray-400)", flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

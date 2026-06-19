import { createAdminClient } from "@/lib/supabase/admin";
import { InboxIcon } from "@/components/ui/Icons";
import { RequestStatusSelect } from "@/components/admin/RequestStatusSelect";
import { updateContactStatus } from "@/lib/actions/requests";

export const dynamic = "force-dynamic";
export const metadata = { title: "お問い合わせ | FitBase CMS" };

const STATUS_OPTIONS = [
  { value: "unread", label: "未読", color: "#B91C1C" },
  { value: "read", label: "既読", color: "#6B7280" },
  { value: "handled", label: "対応済み", color: "#15803D" },
];

export default async function ContactsPage() {
  const supabase = createAdminClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, status, created_at, name, email, subject, message")
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (contacts ?? []).filter((c: any) => c.status === "unread").length;

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        お問い合わせ
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        全{contacts?.length ?? 0}件中、未読 {unreadCount}件
      </p>

      {contacts && contacts.length > 0 ? (
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>受付日</th>
                <th>氏名</th>
                <th>件名</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
                    {new Date(c.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <div>{c.name}</div>
                    <a href={`mailto:${c.email}`} style={{ color: "var(--color-link)", fontSize: "0.75rem", fontWeight: 400 }}>
                      {c.email}
                    </a>
                  </td>
                  <td style={{ fontSize: "0.8125rem", maxWidth: "320px" }}>
                    <details>
                      <summary
                        style={{
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--color-link)",
                        }}
                      >
                        {c.subject || "（件名なし）"}
                      </summary>
                      <p style={{ marginTop: "0.5rem", color: "var(--color-gray-700)", whiteSpace: "pre-wrap" }}>
                        {c.message}
                      </p>
                    </details>
                  </td>
                  <td>
                    <RequestStatusSelect
                      currentStatus={c.status}
                      options={STATUS_OPTIONS}
                      action={updateContactStatus.bind(null, c.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <InboxIcon size={32} />
          問い合わせはありません。
        </div>
      )}
    </div>
  );
}

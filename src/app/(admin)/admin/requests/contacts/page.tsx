import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "お問い合わせ | FitBase CMS" };

export default async function ContactsPage() {
  const supabase = createAdminClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, status, created_at, name, email, subject, message")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        お問い合わせ
      </h1>

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
            {contacts?.map((c: any) => (
              <tr key={c.id}>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleDateString("ja-JP")}</td>
                <td>{c.name}</td>
                <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</td>
                <td>
                  <span
                    className="badge"
                    style={c.status === "unread" ? { backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" } : {}}
                  >
                    {c.status === "unread" ? "未読" : c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!contacts || contacts.length === 0) && (
        <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", marginTop: "1rem" }}>
          問い合わせはありません。
        </p>
      )}
    </div>
  );
}

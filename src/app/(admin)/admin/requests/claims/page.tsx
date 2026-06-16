import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "掲載管理申請 | FitBase CMS" };

export default async function ClaimsPage() {
  const supabase = createAdminClient();
  const { data: claims } = await supabase
    .from("gym_claims")
    .select("id, status, created_at, gyms(name), name, email, message")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        掲載管理申請
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
              <th>ジム名</th>
              <th>申請者</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {claims?.map((c: any) => (
              <tr key={c.id}>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleDateString("ja-JP")}</td>
                <td>{c.gyms?.name ?? "—"}</td>
                <td>{c.name} &lt;{c.email}&gt;</td>
                <td>
                  <span className="badge">{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!claims || claims.length === 0) && (
        <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", marginTop: "1rem" }}>
          申請はありません。
        </p>
      )}
    </div>
  );
}

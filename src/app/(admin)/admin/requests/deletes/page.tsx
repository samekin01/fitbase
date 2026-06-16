import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "掲載削除依頼 | FitBase CMS" };

export default async function DeleteRequestsPage() {
  const supabase = createAdminClient();
  const { data: requests } = await supabase
    .from("gym_delete_requests")
    .select("id, status, created_at, gyms(name), name, email, reason")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        掲載削除依頼
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
              <th>依頼者</th>
              <th>理由</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {requests?.map((r: any) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(r.created_at).toLocaleDateString("ja-JP")}</td>
                <td>{r.gyms?.name ?? "—"}</td>
                <td>{r.name}</td>
                <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason}</td>
                <td><span className="badge">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!requests || requests.length === 0) && (
        <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", marginTop: "1rem" }}>
          依頼はありません。
        </p>
      )}
    </div>
  );
}

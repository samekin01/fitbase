import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "取込履歴 | FitBase CMS" };

export default async function PlacesHistoryPage() {
  const supabase = createAdminClient();
  const { data: jobs } = await supabase
    .from("google_import_jobs")
    .select("id, status, prefecture_id, query, created_at, completed_at, total_found, total_imported")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        取込履歴
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
              <th>実行日時</th>
              <th>クエリ</th>
              <th>件数</th>
              <th>取込数</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {jobs?.map((job: any) => (
              <tr key={job.id}>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(job.created_at).toLocaleString("ja-JP")}</td>
                <td>{job.query ?? "—"}</td>
                <td>{job.total_found ?? "—"}</td>
                <td>{job.total_imported ?? "—"}</td>
                <td><span className="badge">{job.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!jobs || jobs.length === 0) && (
        <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", marginTop: "1rem" }}>
          履歴はありません。
        </p>
      )}
    </div>
  );
}

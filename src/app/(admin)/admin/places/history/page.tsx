import { createAdminClient } from "@/lib/supabase/admin";
import { ClipboardListIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "取込履歴 | FitBase CMS" };

const JOB_STATUS_CLASS: Record<string, string> = {
  completed: "badge badge-green",
  running: "badge badge-blue",
  failed: "badge badge-red",
  pending: "badge badge-yellow",
};

export default async function PlacesHistoryPage() {
  const supabase = createAdminClient();
  const { data: jobs } = await supabase
    .from("google_import_jobs")
    .select("id, status, prefecture_id, query, created_at, completed_at, total_found, total_imported")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        <ClipboardListIcon size={20} />
        取込履歴
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        直近{jobs?.length ?? 0}件
      </p>

      {jobs && jobs.length > 0 ? (
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
              {jobs.map((job: any) => (
                <tr key={job.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
                    {new Date(job.created_at).toLocaleString("ja-JP")}
                  </td>
                  <td style={{ fontWeight: 600 }}>{job.query ?? "—"}</td>
                  <td>{job.total_found ?? "—"}</td>
                  <td style={{ fontWeight: 700 }}>{job.total_imported ?? "—"}</td>
                  <td><span className={JOB_STATUS_CLASS[job.status] ?? "badge badge-gray"}>{job.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <ClipboardListIcon size={32} />
          履歴はありません。
        </div>
      )}
    </div>
  );
}

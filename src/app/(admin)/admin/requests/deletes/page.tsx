import { createAdminClient } from "@/lib/supabase/admin";
import { InboxIcon } from "@/components/ui/Icons";
import { RequestStatusSelect } from "@/components/admin/RequestStatusSelect";
import { updateDeleteRequestStatus } from "@/lib/actions/requests";

export const dynamic = "force-dynamic";
export const metadata = { title: "掲載削除依頼 | FitBase CMS" };

const STATUS_OPTIONS = [
  { value: "pending", label: "未対応", color: "#92400E" },
  { value: "handled", label: "対応済み", color: "#15803D" },
  { value: "rejected", label: "却下", color: "#B91C1C" },
];

export default async function DeleteRequestsPage() {
  const supabase = createAdminClient();
  const { data: requests } = await supabase
    .from("gym_delete_requests")
    .select("id, status, created_at, gyms(name), name, email, reason")
    .order("created_at", { ascending: false })
    .limit(50);

  const pendingCount = (requests ?? []).filter((r: any) => r.status === "pending").length;

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        掲載削除依頼
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        全{requests?.length ?? 0}件中、未対応 {pendingCount}件
      </p>

      {requests && requests.length > 0 ? (
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
              {requests.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
                    {new Date(r.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.gyms?.name ?? "—"}</td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    <div>{r.name}</div>
                    <a href={`mailto:${r.email}`} style={{ color: "var(--color-link)", fontSize: "0.75rem" }}>
                      {r.email}
                    </a>
                  </td>
                  <td style={{ fontSize: "0.8125rem", maxWidth: "260px" }}>
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
                        内容を見る
                      </summary>
                      <p style={{ marginTop: "0.5rem", color: "var(--color-gray-700)", whiteSpace: "pre-wrap" }}>
                        {r.reason}
                      </p>
                    </details>
                  </td>
                  <td>
                    <RequestStatusSelect
                      currentStatus={r.status}
                      options={STATUS_OPTIONS}
                      action={updateDeleteRequestStatus.bind(null, r.id)}
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
          依頼はありません。
        </div>
      )}
    </div>
  );
}

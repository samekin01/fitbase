import { createAdminClient } from "@/lib/supabase/admin";
import { InboxIcon } from "@/components/ui/Icons";
import { RequestStatusSelect } from "@/components/admin/RequestStatusSelect";
import { updateClaimStatus } from "@/lib/actions/requests";

export const dynamic = "force-dynamic";
export const metadata = { title: "掲載管理申請 | FitBase CMS" };

const STATUS_OPTIONS = [
  { value: "pending", label: "未対応", color: "#92400E" },
  { value: "approved", label: "承認", color: "#15803D" },
  { value: "rejected", label: "却下", color: "#B91C1C" },
];

export default async function ClaimsPage() {
  const supabase = createAdminClient();
  const { data: claims } = await supabase
    .from("gym_claims")
    .select("id, status, created_at, gyms(name), name, email, message")
    .order("created_at", { ascending: false })
    .limit(50);

  const pendingCount = (claims ?? []).filter((c: any) => c.status === "pending").length;

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        掲載管理申請
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        全{claims?.length ?? 0}件中、未対応 {pendingCount}件
      </p>

      {claims && claims.length > 0 ? (
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
                <th>メッセージ</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
                    {new Date(c.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.gyms?.name ?? "—"}</td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    <div>{c.name}</div>
                    <a href={`mailto:${c.email}`} style={{ color: "var(--color-link)", fontSize: "0.75rem" }}>
                      {c.email}
                    </a>
                  </td>
                  <td style={{ fontSize: "0.8125rem", maxWidth: "260px" }}>
                    {c.message ? (
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
                          {c.message}
                        </p>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <RequestStatusSelect
                      currentStatus={c.status}
                      options={STATUS_OPTIONS}
                      action={updateClaimStatus.bind(null, c.id)}
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
          申請はありません。
        </div>
      )}
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import { deleteSalesRep } from "@/lib/actions/sales-reps";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { UsersIcon } from "@/components/ui/Icons";
import { RepForm } from "./RepForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "営業担当者管理 | FitBase CMS" };

const ROLE_LABEL: Record<string, { label: string; className: string }> = {
  is: { label: "ISのみ", className: "badge badge-blue" },
  fs: { label: "FSのみ", className: "badge badge-yellow" },
  both: { label: "IS/FS両方", className: "badge badge-green" },
};

export default async function SalesRepsPage() {
  const supabase = createAdminClient();
  const { data: reps } = await (supabase as any)
    .from("sales_reps")
    .select("id, name, role, sort_order")
    .order("sort_order");

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        <UsersIcon size={20} />
        営業担当者管理
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        全{reps?.length ?? 0}件。ここで登録した担当者が、営業リストのIS担当・FS担当の選択肢になります。
      </p>

      <RepForm />

      {reps && reps.length > 0 ? (
        <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden", marginTop: "1.5rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>担当者名</th>
                <th>役割</th>
                <th>表示順</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reps.map((rep: any) => (
                <tr key={rep.id}>
                  <td style={{ fontWeight: 600 }}>{rep.name}</td>
                  <td>
                    <span className={ROLE_LABEL[rep.role]?.className ?? "badge badge-gray"}>
                      {ROLE_LABEL[rep.role]?.label ?? rep.role}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>{rep.sort_order}</td>
                  <td>
                    <ConfirmForm
                      message={`「${rep.name}」を削除しますか？`}
                      action={deleteSalesRep.bind(null, rep.id)}
                      label="削除"
                      buttonClassName="btn btn-sm"
                      buttonStyle={{ backgroundColor: "transparent", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: "1.5rem" }}>
          <UsersIcon size={32} />
          担当者がまだ登録されていません。上のフォームから追加してください。
        </div>
      )}
    </div>
  );
}

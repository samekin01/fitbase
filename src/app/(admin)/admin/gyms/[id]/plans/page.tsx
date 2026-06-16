import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertGymPlan, deleteGymPlan } from "@/lib/actions/gyms";

export const dynamic = "force-dynamic";

export default async function GymPlansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: gym }, { data: plans }] = await Promise.all([
    supabase.from("gyms").select("id, name, monthly_fee_min, total_price_min").eq("id", id).single(),
    supabase.from("gym_plans").select("*").eq("gym_id", id).order("sort_order"),
  ]);

  if (!gym) notFound();

  const upsertAction = upsertGymPlan.bind(null, id);

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Link href={`/admin/gyms/${id}`} style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
          ← {gym.name}
        </Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          料金プラン管理
        </h1>
      </div>

      {/* 代表値 */}
      <div style={{ backgroundColor: "var(--color-gray-50)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--color-gray-600)" }}>
        代表値（自動更新）: 月額最安 {gym.monthly_fee_min != null ? `¥${gym.monthly_fee_min.toLocaleString()}` : "未設定"} / 総額最安 {gym.total_price_min != null ? `¥${gym.total_price_min.toLocaleString()}` : "未設定"}
      </div>

      {/* 既存プラン一覧 */}
      {plans && plans.length > 0 && (
        <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>プラン名</th>
                <th>回数</th>
                <th>期間(週)</th>
                <th>税込総額</th>
                <th>月額換算</th>
                <th>順序</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan: any) => (
                <tr key={plan.id}>
                  <td style={{ fontWeight: 600 }}>{plan.name}</td>
                  <td>{plan.sessions ?? "—"}</td>
                  <td>{plan.duration_weeks ?? "—"}</td>
                  <td>¥{plan.price.toLocaleString()}</td>
                  <td>{plan.monthly_equivalent != null ? `¥${plan.monthly_equivalent.toLocaleString()}` : "—"}</td>
                  <td>{plan.sort_order}</td>
                  <td>
                    <form action={deleteGymPlan.bind(null, id, plan.id)}>
                      <button
                        type="submit"
                        className="btn btn-sm"
                        style={{ backgroundColor: "transparent", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
                        onClick={(e) => { if (!confirm("削除しますか？")) e.preventDefault(); }}
                      >
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 新規追加フォーム */}
      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem" }}>プランを追加</h2>
        <form action={upsertAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="form-label">プラン名 *</label>
              <input name="name" type="text" required className="form-input" placeholder="例: 16回コース" />
            </div>
            <div>
              <label className="form-label">税込総額（円） *</label>
              <input name="price" type="number" required min="0" className="form-input" />
            </div>
            <div>
              <label className="form-label">回数</label>
              <input name="sessions" type="number" min="0" className="form-input" />
            </div>
            <div>
              <label className="form-label">期間（週）</label>
              <input name="duration_weeks" type="number" min="0" className="form-input" />
            </div>
            <div>
              <label className="form-label">月額換算（円）</label>
              <input name="monthly_equivalent" type="number" min="0" className="form-input" />
            </div>
            <div>
              <label className="form-label">表示順</label>
              <input name="sort_order" type="number" defaultValue={0} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">備考</label>
            <input name="note" type="text" className="form-input" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary btn-sm">追加</button>
          </div>
        </form>
      </div>
    </div>
  );
}

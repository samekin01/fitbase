import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { addRankingGym, removeRankingGym, updateRankingGym } from "@/lib/actions/rankings";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function RankingGymsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: ranking }, { data: rows }, { data: gyms }] = await Promise.all([
    supabase.from("rankings").select("id, title").eq("id", id).single(),
    supabase
      .from("ranking_gyms")
      .select("id, rank, reason, gyms(id, name, status)")
      .eq("ranking_id", id)
      .order("rank"),
    supabase.from("gyms").select("id, name, status").order("name"),
  ]);

  if (!ranking) notFound();

  const assignedGymIds = new Set((rows ?? []).map((r: any) => r.gyms?.id));
  const availableGyms = (gyms ?? []).filter((g: any) => !assignedGymIds.has(g.id));
  const addAction = addRankingGym.bind(null, id);

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Link href={`/admin/rankings/${id}`} style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
          ← {ranking.title}
        </Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          ランクイン管理
        </h1>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>ジムを追加</h2>
        <form action={addAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ width: "90px" }}>
            <label className="form-label" htmlFor="rank">順位</label>
            <input id="rank" name="rank" type="number" min="1" required className="form-input" />
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <label className="form-label" htmlFor="gym_id">ジム</label>
            <select id="gym_id" name="gym_id" required className="form-input">
              <option value="">選択してください</option>
              {availableGyms.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}{g.status !== "published" ? "（非公開）" : ""}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "2 1 320px" }}>
            <label className="form-label" htmlFor="reason">選出理由（任意）</label>
            <input id="reason" name="reason" type="text" className="form-input" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">追加</button>
        </form>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>順位</th>
              <th>ジム名</th>
              <th>選出理由</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.length > 0 ? (
              rows.map((row: any) => (
                <tr key={row.id}>
                  <td style={{ width: "90px" }}>
                    <form action={updateRankingGym.bind(null, id, row.id)} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                      <input type="hidden" name="reason" value={row.reason ?? ""} />
                      <input name="rank" type="number" min="1" defaultValue={row.rank} className="form-input" style={{ width: "55px" }} />
                      <button type="submit" className="btn btn-secondary btn-sm">更新</button>
                    </form>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {row.gyms?.name ?? "（削除済みジム）"}
                    {row.gyms?.status !== "published" && (
                      <span className="badge badge-gray" style={{ marginLeft: "0.375rem", fontSize: "0.6875rem" }}>非公開</span>
                    )}
                  </td>
                  <td>
                    <form action={updateRankingGym.bind(null, id, row.id)} style={{ display: "flex", gap: "0.25rem" }}>
                      <input type="hidden" name="rank" value={row.rank} />
                      <input name="reason" type="text" defaultValue={row.reason ?? ""} className="form-input" style={{ minWidth: "220px" }} />
                      <button type="submit" className="btn btn-secondary btn-sm">更新</button>
                    </form>
                  </td>
                  <td>
                    <ConfirmForm
                      message="このジムをランキングから外しますか？"
                      action={removeRankingGym.bind(null, id, row.id)}
                      label="外す"
                      buttonClassName="btn btn-sm"
                      buttonStyle={{ backgroundColor: "transparent", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--color-gray-500)", padding: "2rem" }}>
                  まだランクインしているジムがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { addFeatureGym, removeFeatureGym, updateFeatureGym } from "@/lib/actions/features";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function FeatureGymsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: feature }, { data: rows }, { data: gyms }] = await Promise.all([
    supabase.from("features").select("id, title").eq("id", id).single(),
    supabase
      .from("feature_gyms")
      .select("id, sort_order, comment, section_label, headline, gyms(id, name, slug, status)")
      .eq("feature_id", id)
      .order("sort_order"),
    supabase.from("gyms").select("id, name, status").order("name"),
  ]);

  if (!feature) notFound();

  const assignedGymIds = new Set((rows ?? []).map((r: any) => r.gyms?.id));
  const availableGyms = (gyms ?? []).filter((g: any) => !assignedGymIds.has(g.id));
  const addAction = addFeatureGym.bind(null, id);

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Link href={`/admin/features/${id}`} style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
          ← {feature.title}
        </Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          掲載ジム管理
        </h1>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        エリア見出し（同じ文言の行はまとめて1つの見出しとして表示されます）と見出し（選び方の切り口）を設定すると、公開ページではエリア見出し(##)→ジムごとの見出し→紹介文→カードの順に記事内へ直接挿入されます。未設定の場合は連番付きでまとめて表示されます。
      </p>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem" }}>ジムを追加</h2>
        <form action={addAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label className="form-label" htmlFor="gym_id">ジム</label>
            <select id="gym_id" name="gym_id" required className="form-input">
              <option value="">選択してください</option>
              {availableGyms.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}{g.status !== "published" ? "（非公開）" : ""}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <label className="form-label" htmlFor="section_label">エリア見出し（任意）</label>
            <input id="section_label" name="section_label" type="text" className="form-input" placeholder="例: 名古屋駅周辺" />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label className="form-label" htmlFor="headline">見出し（任意）</label>
            <input id="headline" name="headline" type="text" className="form-input" placeholder="例: 安さで選ぶなら○○ジム" />
          </div>
          <div style={{ flex: "2 1 280px" }}>
            <label className="form-label" htmlFor="comment">紹介文（任意）</label>
            <input id="comment" name="comment" type="text" className="form-input" placeholder="このジムを推す理由など" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">追加</button>
        </form>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>表示順</th>
              <th>ジム名</th>
              <th>エリア見出し／見出し／紹介文</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.length > 0 ? (
              rows.map((row: any) => (
                <tr key={row.id}>
                  <td style={{ width: "90px" }}>
                    <form action={updateFeatureGym.bind(null, id, row.id)}>
                      <input type="hidden" name="comment" value={row.comment ?? ""} />
                      <input type="hidden" name="section_label" value={row.section_label ?? ""} />
                      <input type="hidden" name="headline" value={row.headline ?? ""} />
                      <input name="sort_order" type="number" defaultValue={row.sort_order} className="form-input" style={{ width: "70px" }} />
                      <button type="submit" className="btn btn-secondary btn-sm" style={{ marginTop: "0.25rem" }}>更新</button>
                    </form>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {row.gyms?.name ?? "（削除済みジム）"}
                    {row.gyms?.status !== "published" && (
                      <span className="badge badge-gray" style={{ marginLeft: "0.375rem", fontSize: "0.6875rem" }}>非公開</span>
                    )}
                  </td>
                  <td>
                    <form action={updateFeatureGym.bind(null, id, row.id)} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <input type="hidden" name="sort_order" value={row.sort_order} />
                      <input name="section_label" type="text" defaultValue={row.section_label ?? ""} className="form-input" placeholder="エリア見出し" />
                      <input name="headline" type="text" defaultValue={row.headline ?? ""} className="form-input" placeholder="見出し" />
                      <input name="comment" type="text" defaultValue={row.comment ?? ""} className="form-input" placeholder="紹介文" />
                      <div>
                        <button type="submit" className="btn btn-secondary btn-sm">更新</button>
                      </div>
                    </form>
                  </td>
                  <td>
                    <ConfirmForm
                      message="このジムを特集から外しますか？"
                      action={removeFeatureGym.bind(null, id, row.id)}
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
                  まだジムが掲載されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

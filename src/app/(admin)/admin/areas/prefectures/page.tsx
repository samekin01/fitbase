import { createAdminClient } from "@/lib/supabase/admin";
import { createPrefecture } from "@/lib/actions/prefectures";
import { MapPinIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "都道府県管理 | FitBase CMS" };

export default async function PrefecturesPage() {
  const supabase = createAdminClient();
  const { data: prefectures } = await supabase
    .from("prefectures")
    .select("id, name, slug, sort_order")
    .order("sort_order");

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        <MapPinIcon size={20} />
        都道府県
      </h1>

      {/* ─── 新規登録 ─── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          新規登録
        </h2>
        <form
          action={createPrefecture}
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-end",
            flexWrap: "wrap",
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
          }}
        >
          <div>
            <label className="form-label">都道府県名</label>
            <input name="name" type="text" className="form-input" placeholder="例: 愛知県" required style={{ width: "150px" }} />
          </div>
          <div>
            <label className="form-label">スラッグ</label>
            <input name="slug" type="text" className="form-input" placeholder="例: aichi" required style={{ width: "150px" }} />
          </div>
          <div>
            <label className="form-label">表示順</label>
            <input name="sort_order" type="number" className="form-input" defaultValue={99} style={{ width: "80px" }} />
          </div>
          <button type="submit" className="btn btn-primary">登録</button>
        </form>
      </section>

      {/* ─── 一覧 ─── */}
      <section>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          登録済み一覧（{prefectures?.length ?? 0}件）
        </h2>
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
                <th>名称</th>
                <th>スラッグ</th>
                <th>表示順</th>
              </tr>
            </thead>
            <tbody>
              {prefectures?.map((pref: any) => (
                <tr key={pref.id}>
                  <td style={{ fontWeight: 600 }}>{pref.name}</td>
                  <td><span className="tag-pill" style={{ fontFamily: "monospace" }}>{pref.slug}</span></td>
                  <td style={{ color: "var(--color-gray-500)", fontSize: "0.8125rem" }}>{pref.sort_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!prefectures || prefectures.length === 0) && (
            <div className="empty-state">
              <MapPinIcon size={32} />
              都道府県データがありません。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

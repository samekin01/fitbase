import { createAdminClient } from "@/lib/supabase/admin";
import { createCity, bulkInsertCities } from "@/lib/actions/cities";
import { PRESET_CITIES } from "@/lib/city-presets";
import { BuildingOfficeIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "市区町村管理 | FitBase CMS" };

export default async function CitiesPage() {
  const supabase = createAdminClient();

  const [{ data: cities }, { data: prefectures }] = await Promise.all([
    supabase
      .from("cities")
      .select("id, name, slug, prefectures(name, slug), sort_order")
      .order("sort_order"),
    supabase.from("prefectures").select("id, name, slug").order("sort_order"),
  ]);

  // 一括登録の登録済み件数を計算
  const registeredByPref: Record<string, Set<string>> = {};
  for (const city of cities ?? []) {
    const prefSlug = (city.prefectures as any)?.slug;
    if (!prefSlug) continue;
    if (!registeredByPref[prefSlug]) registeredByPref[prefSlug] = new Set();
    registeredByPref[prefSlug].add(city.slug);
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        <BuildingOfficeIcon size={20} />
        市区町村
      </h1>

      {/* ─── 一括登録 ─── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          県ごとに一括登録
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {(prefectures ?? []).map((pref: any) => {
            const preset = PRESET_CITIES[pref.slug] ?? [];
            const registered = registeredByPref[pref.slug] ?? new Set();
            const remaining = preset.filter((c) => !registered.has(c.slug)).length;
            return (
              <div
                key={pref.id}
                style={{
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  backgroundColor: "var(--color-white)",
                }}
              >
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.375rem" }}>{pref.name}</p>
                <div style={{ height: "5px", borderRadius: "3px", backgroundColor: "var(--color-gray-100)", marginBottom: "0.375rem", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: preset.length > 0 ? `${(registered.size / preset.length) * 100}%` : "0%",
                      backgroundColor: remaining > 0 ? "var(--color-warning)" : "var(--color-success)",
                      borderRadius: "3px",
                    }}
                  />
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "0.75rem" }}>
                  {registered.size}/{preset.length}件登録済
                  {remaining > 0 && (
                    <span style={{ color: "var(--color-warning)", marginLeft: "0.25rem" }}>
                      （未登録{remaining}件）
                    </span>
                  )}
                </p>
                {remaining > 0 ? (
                  <form action={bulkInsertCities}>
                    <input type="hidden" name="pref_slug" value={pref.slug} />
                    <input type="hidden" name="prefecture_id" value={pref.id} />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                      一括登録（{remaining}件）
                    </button>
                  </form>
                ) : (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-success)", fontWeight: 600 }}>
                    登録完了
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 新規1件登録 ─── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          新規登録（1件）
        </h2>
        <form
          action={createCity}
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
            <label className="form-label">都道府県</label>
            <select name="prefecture_id" className="form-input" style={{ width: "130px" }} required>
              <option value="">選択</option>
              {(prefectures ?? []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">市区町村名</label>
            <input name="name" type="text" className="form-input" placeholder="例: 春日井市" required style={{ width: "150px" }} />
          </div>
          <div>
            <label className="form-label">スラッグ</label>
            <input name="slug" type="text" className="form-input" placeholder="例: kasugai" required style={{ width: "150px" }} />
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
          登録済み一覧（{cities?.length ?? 0}件）
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
                <th>都道府県</th>
                <th>表示順</th>
              </tr>
            </thead>
            <tbody>
              {cities?.map((city: any) => (
                <tr key={city.id}>
                  <td style={{ fontWeight: 600 }}>{city.name}</td>
                  <td><span className="tag-pill" style={{ fontFamily: "monospace" }}>{city.slug}</span></td>
                  <td style={{ fontSize: "0.8125rem" }}>{city.prefectures?.name ?? "—"}</td>
                  <td style={{ color: "var(--color-gray-500)", fontSize: "0.8125rem" }}>{city.sort_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!cities || cities.length === 0) && (
            <div className="empty-state">
              <BuildingOfficeIcon size={32} />
              市区町村データがありません。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

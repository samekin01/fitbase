import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStation, deleteStation, bulkInsertStations } from "@/lib/actions/stations";
import { PRESET_STATIONS } from "@/lib/station-presets";

export const dynamic = "force-dynamic";
export const metadata = { title: "駅管理 | FitBase CMS" };

export default async function StationsPage() {
  const supabase = createAdminClient();

  const [{ data: stations }, { data: prefectures }] = await Promise.all([
    supabase
      .from("stations")
      .select("id, name, slug, latitude, longitude, cities(name, slug, prefectures(name, slug))")
      .order("name"),
    supabase
      .from("prefectures")
      .select("id, name, slug, cities(id, name, slug)")
      .order("sort_order"),
  ]);

  // 一括登録の登録済み件数を計算
  const registeredSlugs = new Set((stations ?? []).map((s: any) => s.slug));
  const registeredByPref: Record<string, number> = {};
  for (const [prefSlug, presets] of Object.entries(PRESET_STATIONS)) {
    registeredByPref[prefSlug] = presets.filter((s) => registeredSlugs.has(s.slug)).length;
  }

  const PREF_NAMES: Record<string, string> = {
    aichi: "愛知県",
    gifu: "岐阜県",
    mie: "三重県",
    shizuoka: "静岡県",
  };

  return (
    <div style={{ maxWidth: "960px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          駅マスタ
        </h1>
        <Link href="/admin/gyms/link-stations" className="btn btn-primary btn-sm">
          最寄駅を自動リンク
        </Link>
      </div>

      {/* ─── 一括登録 ─── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          県ごとに一括登録
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {Object.entries(PRESET_STATIONS).map(([prefSlug, presets]) => {
            const registered = registeredByPref[prefSlug] ?? 0;
            const remaining = presets.length - registered;
            return (
              <div
                key={prefSlug}
                style={{
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  backgroundColor: "var(--color-white)",
                }}
              >
                <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                  {PREF_NAMES[prefSlug]}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "0.75rem" }}>
                  {registered}/{presets.length}件登録済
                  {remaining > 0 && (
                    <span style={{ color: "var(--color-warning)", marginLeft: "0.25rem" }}>
                      （未登録{remaining}件）
                    </span>
                  )}
                </p>
                {remaining > 0 ? (
                  <form action={bulkInsertStations}>
                    <input type="hidden" name="pref_slug" value={prefSlug} />
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

      {/* ─── 新規登録 ─── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          新規登録
        </h2>
        <form
          action={createStation}
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
            <label className="form-label">市区町村</label>
            <select name="city_id" className="form-input" style={{ width: "160px" }} required>
              <option value="">選択</option>
              {(prefectures ?? []).map((pref: any) =>
                pref.cities?.map((city: any) => (
                  <option key={city.id} value={city.id}>
                    {pref.name} / {city.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="form-label">駅名</label>
            <input name="name" type="text" className="form-input" placeholder="例: 名古屋駅" required style={{ width: "140px" }} />
          </div>
          <div>
            <label className="form-label">スラッグ</label>
            <input name="slug" type="text" className="form-input" placeholder="例: nagoya-station" required style={{ width: "160px" }} />
          </div>
          <div>
            <label className="form-label">緯度</label>
            <input name="latitude" type="number" step="0.000001" className="form-input" placeholder="35.170915" style={{ width: "120px" }} />
          </div>
          <div>
            <label className="form-label">経度</label>
            <input name="longitude" type="number" step="0.000001" className="form-input" placeholder="136.881537" style={{ width: "120px" }} />
          </div>
          <div>
            <label className="form-label">表示順</label>
            <input name="sort_order" type="number" className="form-input" defaultValue={99} style={{ width: "70px" }} />
          </div>
          <button type="submit" className="btn btn-primary">登録</button>
        </form>
      </section>

      {/* ─── 一覧 ─── */}
      <section>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          登録済み一覧（{stations?.length ?? 0}件）
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
                <th>駅名</th>
                <th>スラッグ</th>
                <th>市区町村</th>
                <th>緯度</th>
                <th>経度</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stations?.map((st: any) => (
                <tr key={st.id}>
                  <td style={{ fontWeight: 600 }}>{st.name}</td>
                  <td style={{ color: "var(--color-gray-500)", fontFamily: "monospace", fontSize: "0.8125rem" }}>{st.slug}</td>
                  <td style={{ fontSize: "0.875rem" }}>
                    {st.cities?.prefectures?.name} / {st.cities?.name ?? "—"}
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
                    {st.latitude?.toFixed(5) ?? "—"}
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
                    {st.longitude?.toFixed(5) ?? "—"}
                  </td>
                  <td>
                    <form action={deleteStation.bind(null, st.id)}>
                      <button
                        type="submit"
                        className="btn btn-sm"
                        style={{ color: "var(--color-error)", border: "1px solid var(--color-error)", background: "transparent", fontSize: "0.75rem" }}
                        onClick={(e) => {
                          if (!confirm(`「${st.name}」を削除しますか？`)) e.preventDefault();
                        }}
                      >
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!stations || stations.length === 0) && (
            <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", padding: "1rem" }}>
              駅データがありません。「最寄駅を自動リンク」から自動取得できます。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

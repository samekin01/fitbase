import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStation, deleteStation } from "@/lib/actions/stations";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const dynamic = "force-dynamic";
export const metadata = { title: "駅管理 | FitBase CMS" };

export default async function StationsPage() {
  const supabase = createAdminClient();

  const [stations, { data: prefectures }] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("stations")
        .select("id, name, slug, latitude, longitude, cities(name, slug, prefectures(name, slug))")
        .order("name")
        .range(from, to)
    ),
    supabase
      .from("prefectures")
      .select("id, name, slug, cities(id, name, slug)")
      .order("sort_order"),
  ]);

  return (
    <div style={{ maxWidth: "960px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          駅マスタ
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/admin/areas/stations/import" className="btn btn-secondary btn-sm">
            CSVから一括インポート
          </Link>
          <Link href="/admin/gyms/link-stations" className="btn btn-primary btn-sm">
            最寄駅を自動リンク
          </Link>
        </div>
      </div>

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
          登録済み一覧（{stations.length}件）
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
              {stations.map((st: any) => (
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
                    <ConfirmForm
                      action={deleteStation.bind(null, st.id)}
                      message={`「${st.name}」を削除しますか？`}
                      label="削除"
                      buttonClassName="btn btn-sm"
                      buttonStyle={{ color: "var(--color-error)", border: "1px solid var(--color-error)", background: "transparent", fontSize: "0.75rem" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stations.length === 0 && (
            <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", padding: "1rem" }}>
              駅データがありません。「最寄駅を自動リンク」から自動取得できます。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "駅管理 | FitBase CMS" };

export default async function StationsPage() {
  const supabase = createAdminClient();
  const { data: stations } = await supabase
    .from("stations")
    .select("id, name, slug, line, cities(name)")
    .order("name");

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        駅
      </h1>

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
              <th>路線</th>
              <th>市区町村</th>
            </tr>
          </thead>
          <tbody>
            {stations?.map((st: any) => (
              <tr key={st.id}>
                <td style={{ fontWeight: 600 }}>{st.name}</td>
                <td style={{ color: "var(--color-gray-500)", fontFamily: "monospace" }}>{st.slug}</td>
                <td>{st.line ?? "—"}</td>
                <td>{st.cities?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!stations || stations.length === 0) && (
        <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", marginTop: "1rem" }}>
          駅データがありません。
        </p>
      )}
    </div>
  );
}

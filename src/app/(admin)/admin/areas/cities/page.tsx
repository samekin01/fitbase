import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "市区町村管理 | FitBase CMS" };

export default async function CitiesPage() {
  const supabase = createAdminClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug, prefectures(name), sort_order")
    .order("sort_order");

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        市区町村
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
                <td style={{ color: "var(--color-gray-500)", fontFamily: "monospace" }}>{city.slug}</td>
                <td>{city.prefectures?.name ?? "—"}</td>
                <td>{city.sort_order}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

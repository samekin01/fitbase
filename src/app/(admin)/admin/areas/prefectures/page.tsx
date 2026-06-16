import { createAdminClient } from "@/lib/supabase/admin";

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
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        都道府県
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
              <th>表示順</th>
            </tr>
          </thead>
          <tbody>
            {prefectures?.map((pref: any) => (
              <tr key={pref.id}>
                <td style={{ fontWeight: 600 }}>{pref.name}</td>
                <td style={{ color: "var(--color-gray-500)", fontFamily: "monospace" }}>{pref.slug}</td>
                <td>{pref.sort_order}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "タグ管理 | FitBase CMS" };

export default async function TagsPage() {
  const supabase = createAdminClient();
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, slug, sort_order")
    .order("sort_order");

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        タグ管理
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
              <th>タグ名</th>
              <th>スラッグ</th>
              <th>表示順</th>
            </tr>
          </thead>
          <tbody>
            {tags?.map((tag: any) => (
              <tr key={tag.id}>
                <td style={{ fontWeight: 600 }}>{tag.name}</td>
                <td style={{ color: "var(--color-gray-500)", fontFamily: "monospace" }}>{tag.slug}</td>
                <td>{tag.sort_order}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!tags || tags.length === 0) && (
        <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", marginTop: "1rem" }}>
          タグがありません。
        </p>
      )}
    </div>
  );
}

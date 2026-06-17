import { createAdminClient } from "@/lib/supabase/admin";
import { createTag, deleteTag } from "@/lib/actions/tags";
import { TagForm } from "./TagForm";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

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

      {/* 新規追加フォーム */}
      <TagForm action={createTag} />

      {/* タグ一覧 */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          marginTop: "1.5rem",
        }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>タグ名</th>
              <th>スラッグ</th>
              <th>表示順</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tags?.map((tag: any) => (
              <tr key={tag.id}>
                <td style={{ fontWeight: 600 }}>{tag.name}</td>
                <td style={{ color: "var(--color-gray-500)", fontFamily: "monospace" }}>{tag.slug}</td>
                <td>{tag.sort_order}</td>
                <td>
                  <ConfirmForm
                    message={`「${tag.name}」を削除しますか？`}
                    action={deleteTag.bind(null, tag.id)}
                    label="削除"
                    buttonClassName="btn btn-sm"
                    buttonStyle={{ backgroundColor: "transparent", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!tags || tags.length === 0) && (
        <p style={{ color: "var(--color-gray-500)", fontSize: "0.875rem", marginTop: "1rem" }}>
          タグがありません。上のフォームから追加してください。
        </p>
      )}
    </div>
  );
}

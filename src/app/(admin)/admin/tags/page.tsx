import { createAdminClient } from "@/lib/supabase/admin";
import { createTag, deleteTag } from "@/lib/actions/tags";
import { TagForm } from "./TagForm";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { TagIcon } from "@/components/ui/Icons";

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
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>
        <TagIcon size={20} />
        タグ管理
      </h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
        全{tags?.length ?? 0}件
      </p>

      {/* 新規追加フォーム */}
      <TagForm action={createTag} />

      {/* タグ一覧 */}
      {tags && tags.length > 0 ? (
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
              {tags.map((tag: any) => (
                <tr key={tag.id}>
                  <td>
                    <span className="tag-pill" style={{ fontWeight: 600, color: "var(--color-gray-700)" }}>{tag.name}</span>
                  </td>
                  <td style={{ color: "var(--color-gray-500)", fontFamily: "monospace", fontSize: "0.8125rem" }}>{tag.slug}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>{tag.sort_order}</td>
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
      ) : (
        <div className="empty-state" style={{ marginTop: "1.5rem" }}>
          <TagIcon size={32} />
          タグがありません。上のフォームから追加してください。
        </div>
      )}
    </div>
  );
}

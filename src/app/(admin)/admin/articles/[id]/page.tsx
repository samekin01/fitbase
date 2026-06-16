import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { updateArticle, deleteArticle } from "@/lib/actions/articles";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: article } = await supabase.from("articles").select("*").eq("id", id).single();

  if (!article) notFound();

  const updateAction = updateArticle.bind(null, id);
  const deleteAction = deleteArticle.bind(null, id);

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          {article.title}
        </h1>
        <StatusBadge status={article.status} />
      </div>
      {article.status === "published" && (
        <p style={{ marginBottom: "1.5rem" }}>
          <a href={`/articles/${article.slug}/`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            公開ページ
          </a>
        </p>
      )}

      <ArticleForm article={article} action={updateAction} />

      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", backgroundColor: "#FFF5F5" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          この記事を削除します。この操作は取り消せません。
        </p>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm(`「${article.title}」を削除しますか？`)) e.preventDefault();
          }}
        >
          <button type="submit" className="btn btn-sm" style={{ backgroundColor: "#DC2626", color: "white", border: "none" }}>
            削除する
          </button>
        </form>
      </div>
    </div>
  );
}

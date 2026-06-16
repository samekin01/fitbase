import { ArticleForm } from "@/components/admin/ArticleForm";
import { createArticle } from "@/lib/actions/articles";

export const metadata = { title: "記事作成 | FitBase CMS" };

export default function ArticleNewPage() {
  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        記事作成
      </h1>
      <ArticleForm action={createArticle} submitLabel="作成する" />
    </div>
  );
}

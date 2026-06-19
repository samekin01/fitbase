import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DocumentTextIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "記事管理 | FitBase CMS" };

export default async function ArticlesListPage() {
  const supabase = createAdminClient();
  const { data: articles, count } = await supabase
    .from("articles")
    .select("id, title, slug, category, status, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false });

  const publishedCount = (articles ?? []).filter((a: any) => a.status === "published").length;
  const draftCount = (articles ?? []).filter((a: any) => a.status === "draft").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          <DocumentTextIcon size={20} />
          記事管理 <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-gray-500)" }}>（{count ?? 0}件）</span>
        </h1>
        <Link href="/admin/articles/new" className="btn btn-primary btn-sm">
          + 新規作成
        </Link>
      </div>

      <div className="count-chip-row">
        <span className="count-chip">公開中 <strong style={{ color: "var(--color-success)" }}>{publishedCount}</strong></span>
        <span className="count-chip">下書き <strong style={{ color: "var(--color-warning)" }}>{draftCount}</strong></span>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>タイトル</th>
              <th>カテゴリ</th>
              <th>ステータス</th>
              <th>更新日</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {articles && articles.length > 0 ? (
              articles.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/articles/${a.id}`} style={{ color: "var(--color-link)", fontWeight: 600 }}>
                      {a.title}
                    </Link>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>{a.slug}</div>
                  </td>
                  <td>{a.category ? <span className="tag-pill">{a.category}</span> : "—"}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                    {new Date(a.updated_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td>
                    <Link href={`/admin/articles/${a.id}`} className="btn btn-secondary btn-sm">編集</Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <DocumentTextIcon size={32} />
                    記事が見つかりません
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

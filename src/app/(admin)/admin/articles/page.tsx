import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "記事管理 | FitBase CMS" };

export default async function ArticlesListPage() {
  const supabase = createAdminClient();
  const { data: articles, count } = await supabase
    .from("articles")
    .select("id, title, slug, category, status, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          記事管理 <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-gray-500)" }}>（{count ?? 0}件）</span>
        </h1>
        <Link href="/admin/articles/new" className="btn btn-primary btn-sm">
          + 新規作成
        </Link>
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
                  <td style={{ fontSize: "0.8125rem" }}>{a.category ?? "—"}</td>
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
                <td colSpan={5} style={{ textAlign: "center", color: "var(--color-gray-500)", padding: "2rem" }}>
                  記事が見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

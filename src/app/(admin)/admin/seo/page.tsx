import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO管理 | FitBase CMS" };

const SEO_TITLE_MAX = 60;
const META_DESCRIPTION_MAX = 120;

type Row = {
  id: string;
  name: string;
  href: string;
  seo_title: string | null;
  meta_description: string | null;
  noindex?: boolean;
};

type Issue = { label: string; severity: "error" | "warning" };

function getIssues(row: Row): Issue[] {
  const issues: Issue[] = [];
  if (!row.seo_title) {
    issues.push({ label: "SEOタイトル未設定", severity: "error" });
  } else if (row.seo_title.length > SEO_TITLE_MAX) {
    issues.push({ label: `SEOタイトルが${SEO_TITLE_MAX}文字超（${row.seo_title.length}文字）`, severity: "warning" });
  }
  if (!row.meta_description) {
    issues.push({ label: "メタディスクリプション未設定", severity: "error" });
  } else if (row.meta_description.length > META_DESCRIPTION_MAX) {
    issues.push({ label: `メタディスクリプションが${META_DESCRIPTION_MAX}文字超（${row.meta_description.length}文字）`, severity: "warning" });
  }
  if (row.noindex) {
    issues.push({ label: "noindex設定中（検索結果に表示されません）", severity: "error" });
  }
  return issues;
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  const withIssues = rows.map((row) => ({ row, issues: getIssues(row) })).filter((r) => r.issues.length > 0);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-900)", margin: 0 }}>{title}</h2>
        <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
          全{rows.length}件中
        </span>
        {withIssues.length > 0 ? (
          <span className="badge badge-red">要対応 {withIssues.length}件</span>
        ) : (
          <span className="badge badge-green">問題なし</span>
        )}
      </div>

      {withIssues.length > 0 ? (
        <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>問題点</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {withIssues.map(({ row, issues }) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {issues.map((issue) => (
                        <span
                          key={issue.label}
                          className={`badge ${issue.severity === "error" ? "badge-red" : "badge-yellow"}`}
                          style={{ alignSelf: "flex-start" }}
                        >
                          {issue.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Link href={row.href} className="btn btn-secondary btn-sm">編集</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
          公開中の{title}はすべてSEOタイトル・メタディスクリプションが設定されています。
        </p>
      )}
    </div>
  );
}

export default async function SeoPage() {
  const supabase = createAdminClient();

  const [gyms, { data: articles }, { data: features }, { data: rankings }, { data: prefectures }, { data: cities }] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("gyms")
        .select("id, name, seo_title, meta_description, noindex")
        .eq("status", "published")
        .range(from, to)
    ),
    supabase.from("articles").select("id, title, seo_title, meta_description, noindex").eq("status", "published"),
    supabase.from("features").select("id, title, seo_title, meta_description").eq("status", "published"),
    supabase.from("rankings").select("id, title, seo_title, meta_description").eq("status", "published"),
    supabase.from("prefectures").select("id, name, seo_title, meta_description"),
    supabase.from("cities").select("id, name, seo_title, meta_description"),
  ]);

  const gymRows: Row[] = (gyms ?? []).map((g: any) => ({
    id: g.id,
    name: g.name,
    href: `/admin/gyms/${g.id}`,
    seo_title: g.seo_title,
    meta_description: g.meta_description,
    noindex: g.noindex,
  }));
  const articleRows: Row[] = (articles ?? []).map((a: any) => ({
    id: a.id,
    name: a.title,
    href: `/admin/articles/${a.id}`,
    seo_title: a.seo_title,
    meta_description: a.meta_description,
    noindex: a.noindex,
  }));
  const featureRows: Row[] = (features ?? []).map((f: any) => ({
    id: f.id,
    name: f.title,
    href: `/admin/features/${f.id}`,
    seo_title: f.seo_title,
    meta_description: f.meta_description,
  }));
  const rankingRows: Row[] = (rankings ?? []).map((r: any) => ({
    id: r.id,
    name: r.title,
    href: `/admin/rankings/${r.id}`,
    seo_title: r.seo_title,
    meta_description: r.meta_description,
  }));
  const prefectureRows: Row[] = (prefectures ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    href: `/admin/areas/prefectures`,
    seo_title: p.seo_title,
    meta_description: p.meta_description,
  }));
  const cityRows: Row[] = (cities ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    href: `/admin/areas/cities`,
    seo_title: c.seo_title,
    meta_description: c.meta_description,
  }));

  const totalIssues = [gymRows, articleRows, featureRows, rankingRows, prefectureRows, cityRows]
    .flat()
    .filter((row) => getIssues(row).length > 0).length;

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>
          SEO管理
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)" }}>
          公開中のジム・記事・特集・ランキングについて、SEOタイトル・メタディスクリプションの設定漏れや文字数オーバーを確認できます。
          {totalIssues > 0 ? (
            <span style={{ color: "var(--color-error)", fontWeight: 700 }}> 現在 {totalIssues}件 が要対応です。</span>
          ) : (
            <span style={{ color: "var(--color-success)", fontWeight: 700 }}> 現在すべて問題ありません。</span>
          )}
        </p>
      </div>

      <Section title="ジム" rows={gymRows} />
      <Section title="記事" rows={articleRows} />
      <Section title="特集" rows={featureRows} />
      <Section title="ランキング" rows={rankingRows} />
      <Section title="都道府県ページ" rows={prefectureRows} />
      <Section title="市区町村ページ" rows={cityRows} />
    </div>
  );
}

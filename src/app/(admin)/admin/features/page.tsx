import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TagIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "特集管理 | FitBase CMS" };

export default async function FeaturesListPage() {
  const supabase = createAdminClient();
  const { data: features, count } = await supabase
    .from("features")
    .select("id, title, slug, category, status, updated_at, prefectures(name), cities(name)", { count: "exact" })
    .order("updated_at", { ascending: false });

  const publishedCount = (features ?? []).filter((f: any) => f.status === "published").length;
  const draftCount = (features ?? []).filter((f: any) => f.status === "draft").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          <TagIcon size={20} />
          特集管理 <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-gray-500)" }}>（{count ?? 0}件）</span>
        </h1>
        <Link href="/admin/features/new" className="btn btn-primary btn-sm">
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
              <th>エリア</th>
              <th>カテゴリ</th>
              <th>ステータス</th>
              <th>更新日</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {features && features.length > 0 ? (
              features.map((f: any) => (
                <tr key={f.id}>
                  <td>
                    <Link href={`/admin/features/${f.id}`} style={{ color: "var(--color-link)", fontWeight: 600 }}>
                      {f.title}
                    </Link>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>{f.slug}</div>
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>{f.cities?.name ?? f.prefectures?.name ?? "—"}</td>
                  <td>{f.category ? <span className="tag-pill">{f.category}</span> : "—"}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                    {new Date(f.updated_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td style={{ display: "flex", gap: "0.375rem" }}>
                    <Link href={`/admin/features/${f.id}`} className="btn btn-secondary btn-sm">編集</Link>
                    <Link href={`/admin/features/${f.id}/gyms`} className="btn btn-secondary btn-sm">掲載ジム</Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <TagIcon size={32} />
                    特集が見つかりません
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

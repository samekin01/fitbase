import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "ランキング管理 | FitBase CMS" };

export default async function RankingsListPage() {
  const supabase = createAdminClient();
  const { data: rankings, count } = await supabase
    .from("rankings")
    .select("id, title, slug, category, status, updated_at, prefectures(name), cities(name)", { count: "exact" })
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          ランキング管理 <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-gray-500)" }}>（{count ?? 0}件）</span>
        </h1>
        <Link href="/admin/rankings/new" className="btn btn-primary btn-sm">
          + 新規作成
        </Link>
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
            {rankings && rankings.length > 0 ? (
              rankings.map((r: any) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/rankings/${r.id}`} style={{ color: "var(--color-link)", fontWeight: 600 }}>
                      {r.title}
                    </Link>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>{r.slug}</div>
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>{r.cities?.name ?? r.prefectures?.name ?? "—"}</td>
                  <td style={{ fontSize: "0.8125rem" }}>{r.category ?? "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                    {new Date(r.updated_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td style={{ display: "flex", gap: "0.375rem" }}>
                    <Link href={`/admin/rankings/${r.id}`} className="btn btn-secondary btn-sm">編集</Link>
                    <Link href={`/admin/rankings/${r.id}/gyms`} className="btn btn-secondary btn-sm">ランクイン</Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--color-gray-500)", padding: "2rem" }}>
                  ランキングが見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

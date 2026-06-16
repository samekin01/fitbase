import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "ジム一覧 | FitBase CMS" };

const STATUS_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "published", label: "公開中" },
  { value: "draft", label: "下書き" },
  { value: "hidden", label: "非公開" },
  { value: "claim_requested", label: "申請済み" },
  { value: "delete_requested", label: "削除申請" },
];

export default async function GymsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const q = params.q ?? "";
  const page = Number(params.page ?? 1);
  const perPage = 50;

  const supabase = createAdminClient();
  let query = supabase
    .from("gyms")
    .select(
      `id, name, slug, status, source, created_at, updated_at,
       prefecture_id, city_id,
       prefectures(name), cities(name)`,
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: gyms, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          ジム一覧 <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-gray-500)" }}>（{count ?? 0}件）</span>
        </h1>
        <Link href="/admin/gyms/new" className="btn btn-primary btn-sm">
          + 新規登録
        </Link>
      </div>

      {/* フィルター */}
      <form method="get" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          name="q"
          type="search"
          placeholder="ジム名で絞込"
          defaultValue={q}
          className="form-input"
          style={{ width: "200px" }}
        />
        <select name="status" defaultValue={status} className="form-input" style={{ width: "140px" }}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary btn-sm">絞込</button>
        {(status || q) && (
          <a href="/admin/gyms" className="btn btn-secondary btn-sm">クリア</a>
        )}
      </form>

      {/* テーブル */}
      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ジム名</th>
              <th>都道府県</th>
              <th>市区町村</th>
              <th>ステータス</th>
              <th>ソース</th>
              <th>更新日</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {gyms && gyms.length > 0 ? (
              gyms.map((gym: any) => (
                <tr key={gym.id}>
                  <td>
                    <Link href={`/admin/gyms/${gym.id}`} style={{ color: "var(--color-link)", fontWeight: 600 }}>
                      {gym.name}
                    </Link>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>{gym.slug}</div>
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>{(gym.prefectures as any)?.name ?? "—"}</td>
                  <td style={{ fontSize: "0.8125rem" }}>{(gym.cities as any)?.name ?? "—"}</td>
                  <td><StatusBadge status={gym.status} /></td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>{gym.source}</td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                    {new Date(gym.updated_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td>
                    <Link href={`/admin/gyms/${gym.id}`} className="btn btn-secondary btn-sm">編集</Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--color-gray-500)", padding: "2rem" }}>
                  ジムが見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.25rem", marginTop: "1rem", justifyContent: "center" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?${new URLSearchParams({ status, q, page: String(p) })}`}
              className={`pagination__item${p === page ? " pagination__item--active" : ""}`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

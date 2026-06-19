import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GymStatusSelect } from "@/components/admin/GymStatusSelect";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { deleteGym, updateGymStatus } from "@/lib/actions/gyms";

export const dynamic = "force-dynamic";
export const metadata = { title: "ジム一覧 | FitBase CMS" };

function buildPageList(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - 2 && p <= current + 2)) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
}

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
                  <td><GymStatusSelect key={gym.status} gymId={gym.id} currentStatus={gym.status} /></td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>{gym.source}</td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                    {new Date(gym.updated_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <Link href={`/admin/gyms/${gym.id}`} className="btn btn-secondary btn-sm">編集</Link>
                      {gym.status !== "published" && (
                        <form action={updateGymStatus.bind(null, gym.id, "published")}>
                          <button type="submit" className="btn btn-sm" style={{ backgroundColor: "#16A34A", color: "white", border: "none" }}>
                            公開
                          </button>
                        </form>
                      )}
                      <ConfirmForm
                        message={`「${gym.name}」を削除しますか？この操作は取り消せません。`}
                        action={deleteGym.bind(null, gym.id)}
                        label="削除"
                        buttonClassName="btn btn-sm"
                        buttonStyle={{ backgroundColor: "transparent", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
                      />
                    </div>
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
        <div style={{ display: "flex", gap: "0.25rem", marginTop: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={`?${new URLSearchParams({ status, q, page: String(Math.max(1, page - 1)) })}`}
            className={`pagination__item${page <= 1 ? " pagination__item--disabled" : ""}`}
          >
            ‹
          </a>
          {buildPageList(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="pagination__item" style={{ border: "none", cursor: "default" }}>
                …
              </span>
            ) : (
              <a
                key={p}
                href={`?${new URLSearchParams({ status, q, page: String(p) })}`}
                className={`pagination__item${p === page ? " pagination__item--active" : ""}`}
              >
                {p}
              </a>
            )
          )}
          <a
            href={`?${new URLSearchParams({ status, q, page: String(Math.min(totalPages, page + 1)) })}`}
            className={`pagination__item${page >= totalPages ? " pagination__item--disabled" : ""}`}
          >
            ›
          </a>
        </div>
      )}
    </div>
  );
}

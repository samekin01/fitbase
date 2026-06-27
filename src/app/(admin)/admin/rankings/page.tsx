import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { RankingAiFillRunner } from "@/components/admin/RankingAiFillRunner";
import { AreaRankingGenerator } from "@/components/admin/AreaRankingGenerator";
import { bulkGenerateCityRankings } from "@/lib/actions/rankings";
import { TrophyIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "ランキング管理 | FitBase CMS" };

export default async function RankingsListPage() {
  const supabase = createAdminClient();
  const [{ data: rankings, count }, { data: prefectures }, { data: cities }] = await Promise.all([
    supabase
      .from("rankings")
      .select("id, title, slug, category, status, body_md, updated_at, prefectures(name), cities(name)", { count: "exact" })
      .order("updated_at", { ascending: false }),
    supabase.from("prefectures").select("id, name").order("sort_order"),
    supabase.from("cities").select("id, name, prefecture_id").order("sort_order"),
  ]);

  const aiFillTargets = (rankings ?? [])
    .filter((r: any) => r.status === "draft")
    .map((r: any) => ({ id: r.id, title: r.title, body_md: r.body_md }));

  const publishedCount = (rankings ?? []).filter((r: any) => r.status === "published").length;
  const draftCount = (rankings ?? []).filter((r: any) => r.status === "draft").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
          <TrophyIcon size={20} />
          ランキング管理 <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-gray-500)" }}>（{count ?? 0}件）</span>
        </h1>
        <Link href="/admin/rankings/new" className="btn btn-primary btn-sm">
          + 新規作成
        </Link>
      </div>

      <div className="count-chip-row">
        <span className="count-chip">公開中 <strong style={{ color: "var(--color-success)" }}>{publishedCount}</strong></span>
        <span className="count-chip">下書き <strong style={{ color: "var(--color-warning)" }}>{draftCount}</strong></span>
      </div>

      <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem" }}>都市ごとに自動生成</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "0.75rem" }}>
          公開ジムが指定件数以上ある都市（まだランキングが無い都市のみ）について、評価70%＋価格30%のスコア順に「○○市のパーソナルジムおすすめランキング」を下書き状態で自動生成します。内容を確認してから公開してください。
        </p>
        <ConfirmForm
          action={bulkGenerateCityRankings}
          message="ランキングが無い都市について、下書き状態のランキングを一括生成します。よろしいですか？"
          label="自動生成を実行"
          buttonClassName="btn btn-primary btn-sm"
        >
          <label className="form-label" htmlFor="min_gyms" style={{ marginBottom: 0 }}>対象都市の最低ジム数</label>
          <input id="min_gyms" name="min_gyms" type="number" min="1" defaultValue={10} className="form-input" style={{ width: "70px" }} />
          <label className="form-label" htmlFor="limit" style={{ marginBottom: 0 }}>掲載上位</label>
          <input id="limit" name="limit" type="number" min="1" max="50" defaultValue={10} className="form-input" style={{ width: "70px" }} />
          <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>件</span>
        </ConfirmForm>
      </div>

      <AreaRankingGenerator prefectures={prefectures ?? []} cities={cities ?? []} />

      <RankingAiFillRunner rankings={aiFillTargets} />

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
                  <td>{r.category ? <span className="tag-pill">{r.category}</span> : "—"}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                    {new Date(r.updated_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <Link href={`/admin/rankings/${r.id}`} className="btn btn-secondary btn-sm">編集</Link>
                      <Link href={`/admin/rankings/${r.id}/gyms`} className="btn btn-secondary btn-sm">ランクイン</Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <TrophyIcon size={32} />
                    ランキングが見つかりません
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

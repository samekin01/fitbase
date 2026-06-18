import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RankingForm } from "@/components/admin/RankingForm";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { updateRanking, deleteRanking } from "@/lib/actions/rankings";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const dynamic = "force-dynamic";

export default async function RankingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: ranking }, { data: prefectures }, { data: cities }, stations] = await Promise.all([
    supabase.from("rankings").select("*").eq("id", id).single(),
    supabase.from("prefectures").select("*").order("sort_order"),
    supabase.from("cities").select("*").order("sort_order"),
    fetchAllRows((from, to) =>
      supabase.from("stations").select("*").order("sort_order").range(from, to)
    ),
  ]);

  if (!ranking) notFound();

  const updateAction = updateRanking.bind(null, id);
  const deleteAction = deleteRanking.bind(null, id);

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
              {ranking.title}
            </h1>
            <StatusBadge status={ranking.status} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href={`/admin/rankings/${id}/gyms`} className="btn btn-secondary btn-sm">
            ランクイン管理
          </Link>
          {ranking.status === "published" && (
            <a href={`/rankings/${ranking.slug}/`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              公開ページ
            </a>
          )}
        </div>
      </div>

      <RankingForm
        ranking={ranking}
        prefectures={prefectures ?? []}
        cities={cities ?? []}
        stations={stations}
        action={updateAction}
      />

      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", backgroundColor: "#FFF5F5" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          このランキングを削除します。この操作は取り消せません。
        </p>
        <ConfirmForm
          message={`「${ranking.title}」を削除しますか？`}
          action={deleteAction}
          label="削除する"
          buttonClassName="btn btn-sm"
          buttonStyle={{ backgroundColor: "#DC2626", color: "white", border: "none" }}
        />
      </div>
    </div>
  );
}

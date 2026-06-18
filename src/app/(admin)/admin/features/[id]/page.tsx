import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { FeatureForm } from "@/components/admin/FeatureForm";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { updateFeature, deleteFeature } from "@/lib/actions/features";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const dynamic = "force-dynamic";

export default async function FeatureEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: feature }, { data: prefectures }, { data: cities }, stations] = await Promise.all([
    supabase.from("features").select("*").eq("id", id).single(),
    supabase.from("prefectures").select("*").order("sort_order"),
    supabase.from("cities").select("*").order("sort_order"),
    fetchAllRows((from, to) =>
      supabase.from("stations").select("*").order("sort_order").range(from, to)
    ),
  ]);

  if (!feature) notFound();

  const updateAction = updateFeature.bind(null, id);
  const deleteAction = deleteFeature.bind(null, id);

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
              {feature.title}
            </h1>
            <StatusBadge status={feature.status} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href={`/admin/features/${id}/gyms`} className="btn btn-secondary btn-sm">
            掲載ジム管理
          </Link>
          {feature.status === "published" && (
            <a href={`/features/${feature.slug}/`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              公開ページ
            </a>
          )}
        </div>
      </div>

      <FeatureForm
        feature={feature}
        prefectures={prefectures ?? []}
        cities={cities ?? []}
        stations={stations}
        action={updateAction}
      />

      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", backgroundColor: "#FFF5F5" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          この特集を削除します。この操作は取り消せません。
        </p>
        <ConfirmForm
          message={`「${feature.title}」を削除しますか？`}
          action={deleteAction}
          label="削除する"
          buttonClassName="btn btn-sm"
          buttonStyle={{ backgroundColor: "#DC2626", color: "white", border: "none" }}
        />
      </div>
    </div>
  );
}

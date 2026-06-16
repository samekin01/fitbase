import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { GymForm } from "@/components/admin/GymForm";
import { DeleteGymButton } from "@/components/admin/DeleteGymButton";
import { PlacesSyncButton } from "@/components/admin/PlacesSyncButton";
import { updateGym, deleteGym } from "@/lib/actions/gyms";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function GymEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    { data: gym },
    { data: prefectures },
    { data: cities },
    { data: stations },
    { data: tags },
    { data: gymTags },
  ] = await Promise.all([
    supabase.from("gyms").select("*").eq("id", id).single(),
    supabase.from("prefectures").select("*").order("sort_order"),
    supabase.from("cities").select("*").order("sort_order"),
    supabase.from("stations").select("*").order("sort_order"),
    supabase.from("tags").select("*").order("name"),
    supabase.from("gym_tags").select("tag_id").eq("gym_id", id),
  ]);

  if (!gym) notFound();

  const assignedTagIds = gymTags?.map((t: any) => t.tag_id) ?? [];
  const updateAction = updateGym.bind(null, id);
  const deleteAction = deleteGym.bind(null, id);

  return (
    <div style={{ maxWidth: "800px" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)" }}>
              {gym.name}
            </h1>
            <StatusBadge status={gym.status} />
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
            更新: {new Date(gym.updated_at).toLocaleString("ja-JP")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href={`/admin/gyms/${id}/plans`} className="btn btn-secondary btn-sm">
            料金プラン
          </Link>
          <Link href={`/admin/gyms/${id}/images`} className="btn btn-secondary btn-sm">
            画像
          </Link>
          {gym.status === "published" && (
            <a
              href={`/gyms/${gym.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              公開ページ
            </a>
          )}
          {gym.google_place_id && (
            <PlacesSyncButton gymId={id} />
          )}
        </div>
      </div>

      <GymForm
        gym={gym}
        prefectures={prefectures ?? []}
        cities={cities ?? []}
        stations={stations ?? []}
        allTags={tags ?? []}
        assignedTagIds={assignedTagIds}
        action={updateAction}
      />

      {/* 削除 */}
      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #FCA5A5", borderRadius: "var(--radius-md)", backgroundColor: "#FFF5F5" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-700)", marginBottom: "0.75rem" }}>
          このジムを削除します。この操作は取り消せません。
        </p>
        <DeleteGymButton gymName={gym.name} action={deleteAction} />
      </div>
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import { GymForm } from "@/components/admin/GymForm";
import { createGym } from "@/lib/actions/gyms";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const metadata = { title: "ジム登録 | FitBase CMS" };

export default async function GymNewPage() {
  const supabase = createAdminClient();
  const [
    { data: prefectures },
    { data: cities },
    stations,
    { data: tags },
  ] = await Promise.all([
    supabase.from("prefectures").select("*").order("sort_order"),
    supabase.from("cities").select("*").order("sort_order"),
    fetchAllRows((from, to) =>
      supabase.from("stations").select("*").order("sort_order").range(from, to)
    ),
    supabase.from("tags").select("*").order("name"),
  ]);

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        ジム登録
      </h1>
      <GymForm
        prefectures={prefectures ?? []}
        cities={cities ?? []}
        stations={stations}
        allTags={tags ?? []}
        assignedTagIds={[]}
        action={createGym}
        submitLabel="登録する"
      />
    </div>
  );
}

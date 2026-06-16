import { createAdminClient } from "@/lib/supabase/admin";
import { RankingForm } from "@/components/admin/RankingForm";
import { createRanking } from "@/lib/actions/rankings";

export const metadata = { title: "ランキング作成 | FitBase CMS" };

export default async function RankingNewPage() {
  const supabase = createAdminClient();
  const [{ data: prefectures }, { data: cities }, { data: stations }] = await Promise.all([
    supabase.from("prefectures").select("*").order("sort_order"),
    supabase.from("cities").select("*").order("sort_order"),
    supabase.from("stations").select("*").order("sort_order"),
  ]);

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        ランキング作成
      </h1>
      <RankingForm
        prefectures={prefectures ?? []}
        cities={cities ?? []}
        stations={stations ?? []}
        action={createRanking}
        submitLabel="作成する"
      />
    </div>
  );
}

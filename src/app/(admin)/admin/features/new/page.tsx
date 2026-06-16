import { createAdminClient } from "@/lib/supabase/admin";
import { FeatureForm } from "@/components/admin/FeatureForm";
import { createFeature } from "@/lib/actions/features";

export const metadata = { title: "特集作成 | FitBase CMS" };

export default async function FeatureNewPage() {
  const supabase = createAdminClient();
  const [{ data: prefectures }, { data: cities }, { data: stations }] = await Promise.all([
    supabase.from("prefectures").select("*").order("sort_order"),
    supabase.from("cities").select("*").order("sort_order"),
    supabase.from("stations").select("*").order("sort_order"),
  ]);

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        特集作成
      </h1>
      <FeatureForm
        prefectures={prefectures ?? []}
        cities={cities ?? []}
        stations={stations ?? []}
        action={createFeature}
        submitLabel="作成する"
      />
    </div>
  );
}

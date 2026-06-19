import { createAdminClient } from "@/lib/supabase/admin";
import { PlacesImporter } from "@/components/admin/PlacesImporter";
import { GlobeAltIcon } from "@/components/ui/Icons";

export const metadata = { title: "Google Places 取込 | FitBase CMS" };

export default async function PlacesImportPage() {
  const supabase = createAdminClient();
  const [{ data: prefectures }, { data: cities }] = await Promise.all([
    supabase.from("prefectures").select("id, name, slug").order("sort_order"),
    supabase.from("cities").select("id, name, prefecture_id").order("sort_order"),
  ]);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>
          <GlobeAltIcon size={20} />
          Google Places 取込
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)" }}>
          Google Places API でパーソナルジムを検索し、ドラフトとして取込みます。取込後は管理画面で詳細を編集・公開してください。
        </p>
      </div>

      <PlacesImporter prefectures={prefectures ?? []} cities={cities ?? []} />
    </div>
  );
}

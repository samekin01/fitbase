"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRESET_STATIONS } from "@/lib/station-presets";

export async function createStation(formData: FormData) {
  const supabase = createAdminClient();
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const city_id = formData.get("city_id") as string;
  const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
  const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;
  const sort_order = parseInt((formData.get("sort_order") as string) || "99", 10);

  if (!name || !slug || !city_id) throw new Error("必須項目が不足しています");

  const { error } = await supabase
    .from("stations")
    .insert({ name, slug, city_id, latitude, longitude, sort_order } as any);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/areas/stations");
}

export async function deleteStation(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("stations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/areas/stations");
}

export async function bulkInsertStations(formData: FormData) {
  const supabase = createAdminClient();
  const prefSlug = formData.get("pref_slug") as string;
  const presets = PRESET_STATIONS[prefSlug];
  if (!presets) throw new Error("プリセットが見つかりません");

  // 市区町村slug → id のマップを作成
  const citySlugs = [...new Set(presets.map((s) => s.citySlug))];
  const { data: cities } = await supabase
    .from("cities")
    .select("id, slug")
    .in("slug", citySlugs);
  const cityMap = Object.fromEntries((cities ?? []).map((c: any) => [c.slug, c.id]));

  // 既存スラッグを取得
  const { data: existing } = await supabase
    .from("stations")
    .select("slug")
    .in("slug", presets.map((s) => s.slug));
  const existingSlugs = new Set((existing ?? []).map((s: any) => s.slug));

  const toInsert = presets
    .filter((s) => !existingSlugs.has(s.slug) && cityMap[s.citySlug])
    .map((s) => ({
      name: s.name,
      slug: s.slug,
      city_id: cityMap[s.citySlug],
      latitude: s.lat,
      longitude: s.lng,
      sort_order: 99,
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("stations").insert(toInsert as any);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/areas/stations");
}

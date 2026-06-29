"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRESET_CITIES } from "@/lib/city-presets";

export async function createCity(formData: FormData) {
  const supabase = createAdminClient();
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const prefecture_id = formData.get("prefecture_id") as string;
  const sort_order = parseInt((formData.get("sort_order") as string) || "99", 10);

  if (!name || !slug || !prefecture_id) throw new Error("必須項目が不足しています");

  const { error } = await supabase.from("cities").insert({ name, slug, prefecture_id, sort_order } as any);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/areas/cities");
}

export async function updateCitySeo(formData: FormData) {
  const supabase = createAdminClient();
  const id = formData.get("id") as string;
  const seo_title = ((formData.get("seo_title") as string) || "").trim() || null;
  const meta_description = ((formData.get("meta_description") as string) || "").trim() || null;

  if (!id) throw new Error("idが不足しています");

  const { error } = await supabase.from("cities").update({ seo_title, meta_description } as any).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/areas/cities");
  revalidatePath("/admin/seo");
}

export async function bulkInsertCities(formData: FormData) {
  const supabase = createAdminClient();
  const prefSlug = formData.get("pref_slug") as string;
  const prefId = formData.get("prefecture_id") as string;

  const cities = PRESET_CITIES[prefSlug];
  if (!cities) throw new Error("プリセットが見つかりません");

  const { data: existing } = await supabase
    .from("cities")
    .select("slug")
    .eq("prefecture_id", prefId);

  const existingSlugs = new Set(existing?.map((c: any) => c.slug) ?? []);
  const toInsert = cities
    .filter((c) => !existingSlugs.has(c.slug))
    .map((c) => ({ ...c, prefecture_id: prefId }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("cities").insert(toInsert as any);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/areas/cities");
}

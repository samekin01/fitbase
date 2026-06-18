"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

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

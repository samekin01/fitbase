"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createPrefecture(formData: FormData) {
  const supabase = createAdminClient();
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const sort_order = parseInt((formData.get("sort_order") as string) || "99", 10);

  if (!name || !slug) throw new Error("必須項目が不足しています");

  const { error } = await supabase.from("prefectures").insert({ name, slug, sort_order } as any);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/areas/prefectures");
}

export async function updatePrefectureSeo(formData: FormData) {
  const supabase = createAdminClient();
  const id = formData.get("id") as string;
  const seo_title = ((formData.get("seo_title") as string) || "").trim() || null;
  const meta_description = ((formData.get("meta_description") as string) || "").trim() || null;

  if (!id) throw new Error("idが不足しています");

  const { error } = await supabase.from("prefectures").update({ seo_title, meta_description } as any).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/areas/prefectures");
  revalidatePath("/admin/seo");
}

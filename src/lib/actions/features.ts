"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentStatus } from "@/types/tables";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

const FAQ_SLOTS = 5;

function parseFaqJson(formData: FormData): { q: string; a: string }[] | null {
  const items: { q: string; a: string }[] = [];
  for (let i = 0; i < FAQ_SLOTS; i++) {
    const q = ((formData.get(`faq_q_${i}`) as string) ?? "").trim();
    const a = ((formData.get(`faq_a_${i}`) as string) ?? "").trim();
    if (q && a) items.push({ q, a });
  }
  return items.length > 0 ? items : null;
}

function parseFeatureFormData(formData: FormData) {
  return {
    title: (formData.get("title") as string).trim(),
    slug: (formData.get("slug") as string).trim() || slugify(formData.get("title") as string),
    prefecture_id: (formData.get("prefecture_id") as string) || null,
    city_id: (formData.get("city_id") as string) || null,
    station_id: (formData.get("station_id") as string) || null,
    category: (formData.get("category") as string) || null,
    body_md: (formData.get("body_md") as string) || null,
    faq_json: parseFaqJson(formData),
    eyecatch_image_url: (formData.get("eyecatch_image_url") as string) || null,
    seo_title: (formData.get("seo_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    noindex: formData.get("noindex") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
    status: (formData.get("status") as ContentStatus) || "draft",
  };
}

export async function createFeature(formData: FormData) {
  const supabase = createAdminClient();
  const data = parseFeatureFormData(formData);

  const { data: feature, error } = await supabase
    .from("features")
    .insert(data as any)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/features");
  redirect(`/admin/features/${feature.id}`);
}

export async function updateFeature(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const data = parseFeatureFormData(formData);

  const { error } = await supabase.from("features").update(data as any).eq("id", id);
  if (error) return { error: error.message };

  const { data: feature } = await supabase.from("features").select("slug").eq("id", id).single();
  if (feature?.slug) revalidatePath(`/features/${feature.slug}`);
  revalidatePath("/admin/features");
  revalidatePath("/features");
  return { success: true };
}

export async function deleteFeature(id: string) {
  const supabase = createAdminClient();
  const { data: feature } = await supabase.from("features").select("slug").eq("id", id).single();

  const { error } = await supabase.from("features").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (feature?.slug) revalidatePath(`/features/${feature.slug}`);
  revalidatePath("/admin/features");
  revalidatePath("/features");
  redirect("/admin/features");
}

// 掲載ジム操作（feature_gyms）
export async function addFeatureGym(featureId: string, formData: FormData) {
  const supabase = createAdminClient();
  const gymId = formData.get("gym_id") as string;
  if (!gymId) return;

  const { data: existing } = await supabase
    .from("feature_gyms")
    .select("sort_order")
    .eq("feature_id", featureId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase.from("feature_gyms").insert({
    feature_id: featureId,
    gym_id: gymId,
    comment: (formData.get("comment") as string) || null,
    sort_order: nextOrder,
  });
  if (error) throw new Error(error.message);

  const { data: feature } = await supabase.from("features").select("slug").eq("id", featureId).single();
  if (feature?.slug) revalidatePath(`/features/${feature.slug}`);
  revalidatePath(`/admin/features/${featureId}/gyms`);
}

export async function removeFeatureGym(featureId: string, rowId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("feature_gyms").delete().eq("id", rowId);
  if (error) throw new Error(error.message);

  const { data: feature } = await supabase.from("features").select("slug").eq("id", featureId).single();
  if (feature?.slug) revalidatePath(`/features/${feature.slug}`);
  revalidatePath(`/admin/features/${featureId}/gyms`);
}

export async function updateFeatureGym(featureId: string, rowId: string, formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feature_gyms")
    .update({
      comment: (formData.get("comment") as string) || null,
      sort_order: Number(formData.get("sort_order") ?? 0),
    })
    .eq("id", rowId);
  if (error) throw new Error(error.message);

  const { data: feature } = await supabase.from("features").select("slug").eq("id", featureId).single();
  if (feature?.slug) revalidatePath(`/features/${feature.slug}`);
  revalidatePath(`/admin/features/${featureId}/gyms`);
}

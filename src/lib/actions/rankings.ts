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

function parseRankingFormData(formData: FormData) {
  return {
    title: (formData.get("title") as string).trim(),
    slug: (formData.get("slug") as string).trim() || slugify(formData.get("title") as string),
    prefecture_id: (formData.get("prefecture_id") as string) || null,
    city_id: (formData.get("city_id") as string) || null,
    station_id: (formData.get("station_id") as string) || null,
    category: (formData.get("category") as string) || null,
    body_md: (formData.get("body_md") as string) || null,
    seo_title: (formData.get("seo_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    status: (formData.get("status") as ContentStatus) || "draft",
  };
}

export async function createRanking(formData: FormData) {
  const supabase = createAdminClient();
  const data = parseRankingFormData(formData);

  const { data: ranking, error } = await supabase
    .from("rankings")
    .insert(data)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/rankings");
  redirect(`/admin/rankings/${ranking.id}`);
}

export async function updateRanking(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const data = parseRankingFormData(formData);

  const { error } = await supabase.from("rankings").update(data).eq("id", id);
  if (error) return { error: error.message };

  const { data: ranking } = await supabase.from("rankings").select("slug").eq("id", id).single();
  if (ranking?.slug) revalidatePath(`/rankings/${ranking.slug}`);
  revalidatePath("/admin/rankings");
  revalidatePath("/rankings");
  return { success: true };
}

export async function deleteRanking(id: string) {
  const supabase = createAdminClient();
  const { data: ranking } = await supabase.from("rankings").select("slug").eq("id", id).single();

  const { error } = await supabase.from("rankings").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (ranking?.slug) revalidatePath(`/rankings/${ranking.slug}`);
  revalidatePath("/admin/rankings");
  revalidatePath("/rankings");
  redirect("/admin/rankings");
}

// ランクイン操作（ranking_gyms）
export async function addRankingGym(rankingId: string, formData: FormData) {
  const supabase = createAdminClient();
  const gymId = formData.get("gym_id") as string;
  const rank = Number(formData.get("rank"));
  if (!gymId || !rank) return;

  const { error } = await supabase.from("ranking_gyms").insert({
    ranking_id: rankingId,
    gym_id: gymId,
    rank,
    reason: (formData.get("reason") as string) || null,
  });
  if (error) throw new Error(error.message);

  const { data: ranking } = await supabase.from("rankings").select("slug").eq("id", rankingId).single();
  if (ranking?.slug) revalidatePath(`/rankings/${ranking.slug}`);
  revalidatePath(`/admin/rankings/${rankingId}/gyms`);
}

export async function removeRankingGym(rankingId: string, rowId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("ranking_gyms").delete().eq("id", rowId);
  if (error) throw new Error(error.message);

  const { data: ranking } = await supabase.from("rankings").select("slug").eq("id", rankingId).single();
  if (ranking?.slug) revalidatePath(`/rankings/${ranking.slug}`);
  revalidatePath(`/admin/rankings/${rankingId}/gyms`);
}

export async function updateRankingGym(rankingId: string, rowId: string, formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ranking_gyms")
    .update({
      rank: Number(formData.get("rank")),
      reason: (formData.get("reason") as string) || null,
    })
    .eq("id", rowId);
  if (error) throw new Error(error.message);

  const { data: ranking } = await supabase.from("rankings").select("slug").eq("id", rankingId).single();
  if (ranking?.slug) revalidatePath(`/rankings/${ranking.slug}`);
  revalidatePath(`/admin/rankings/${rankingId}/gyms`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { GymStatus } from "@/types/tables";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

function parseGymFormData(formData: FormData) {
  return {
    name: (formData.get("name") as string).trim(),
    slug: (formData.get("slug") as string).trim() || slugify(formData.get("name") as string),
    prefecture_id: (formData.get("prefecture_id") as string) || null,
    city_id: (formData.get("city_id") as string) || null,
    nearest_station_id: (formData.get("nearest_station_id") as string) || null,
    area_name: (formData.get("area_name") as string) || null,
    address: (formData.get("address") as string) || null,
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
    phone: (formData.get("phone") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    google_maps_url: (formData.get("google_maps_url") as string) || null,
    google_place_id: (formData.get("google_place_id") as string) || null,
    admission_fee: formData.get("admission_fee") ? Number(formData.get("admission_fee")) : null,
    has_trial: formData.get("has_trial") === "on",
    trial_fee: formData.get("trial_fee") ? Number(formData.get("trial_fee")) : null,
    description: (formData.get("description") as string) || null,
    recommended_points: (formData.get("recommended_points") as string) || null,
    target_users: (formData.get("target_users") as string) || null,
    trainer_info: (formData.get("trainer_info") as string) || null,
    facilities: (formData.get("facilities") as string) || null,
    has_nutrition_support: formData.get("has_nutrition_support") === "on",
    has_private_room: formData.get("has_private_room") === "on",
    is_female_friendly: formData.get("is_female_friendly") === "on",
    supports_contest: formData.get("supports_contest") === "on",
    is_near_station: formData.get("is_near_station") === "on",
    seo_title: (formData.get("seo_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    noindex: formData.get("noindex") === "on",
    status: (formData.get("status") as GymStatus) || "draft",
    source: (formData.get("source") as string) || "manual",
  };
}

export async function createGym(formData: FormData) {
  const supabase = createAdminClient();
  const data = parseGymFormData(formData);

  const { data: gym, error } = await supabase
    .from("gyms")
    .insert(data)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/gyms");
  redirect(`/admin/gyms/${gym.id}`);
}

export async function updateGym(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

  const data = parseGymFormData(formData);
  const wasPublished = formData.get("_was_published") === "true";
  const isNowPublished = data.status === "published";

  const updateData: Record<string, unknown> = { ...data };

  if (!wasPublished && isNowPublished) {
    updateData.published_at = new Date().toISOString();
    updateData.published_by = user?.id ?? null;
  }

  const { error } = await supabase
    .from("gyms")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  // 公開済みジムの ISR 再検証
  if (isNowPublished) {
    const { data: gym } = await supabase
      .from("gyms")
      .select("slug")
      .eq("id", id)
      .single();
    if (gym?.slug) {
      revalidatePath(`/gyms/${gym.slug}`);
    }
  }

  revalidatePath("/admin/gyms");
  revalidatePath(`/admin/gyms/${id}`);
  return { success: true };
}

export async function updateGymStatus(gymId: string, status: string) {
  const supabase = createAdminClient();
  const { data: gym } = await supabase.from("gyms").select("slug, status").eq("id", gymId).single();
  const { error } = await supabase.from("gyms").update({ status } as any).eq("id", gymId);
  if (error) throw new Error(error.message);
  if (gym?.slug) revalidatePath(`/gyms/${gym.slug}`);
  revalidatePath("/admin/gyms");
}

export async function deleteGym(id: string) {
  const supabase = createAdminClient();

  const { data: gym } = await supabase
    .from("gyms")
    .select("slug, status")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("gyms").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (gym?.status === "published" && gym?.slug) {
    revalidatePath(`/gyms/${gym.slug}`);
  }

  revalidatePath("/admin/gyms");
  redirect("/admin/gyms");
}

// プラン操作
export async function upsertGymPlan(gymId: string, formData: FormData) {
  const supabase = createAdminClient();
  const id = formData.get("id") as string | null;

  const data = {
    gym_id: gymId,
    name: (formData.get("name") as string).trim(),
    sessions: formData.get("sessions") ? Number(formData.get("sessions")) : null,
    duration_weeks: formData.get("duration_weeks") ? Number(formData.get("duration_weeks")) : null,
    price: Number(formData.get("price")),
    monthly_equivalent: formData.get("monthly_equivalent")
      ? Number(formData.get("monthly_equivalent"))
      : null,
    note: (formData.get("note") as string) || null,
    sort_order: Number(formData.get("sort_order") ?? 0),
  };

  if (id) {
    const { error } = await supabase.from("gym_plans").update(data).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("gym_plans").insert(data);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/gyms/${gymId}/plans`);
}

export async function deleteGymPlan(gymId: string, planId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("gym_plans").delete().eq("id", planId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/gyms/${gymId}/plans`);
}

// タグ操作
export async function setGymTags(gymId: string, tagIds: string[]) {
  const supabase = createAdminClient();
  await supabase.from("gym_tags").delete().eq("gym_id", gymId);
  if (tagIds.length > 0) {
    const { error } = await supabase
      .from("gym_tags")
      .insert(tagIds.map((tag_id) => ({ gym_id: gymId, tag_id })));
    if (error) return { error: error.message };
  }
  revalidatePath(`/admin/gyms/${gymId}`);
  return { success: true };
}

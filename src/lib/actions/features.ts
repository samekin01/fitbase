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

// AIが選定した掲載ジム（FeatureForm側で隠しフィールドにJSONで保存される、エリアごとにグループ化された構造）を
// feature_gymsへ反映する。このフィールドが空（AIでの選定を一度も行っていない）場合は、既存の手動キュレーションを壊さないよう何もしない。
type AiGymSection = { area_label: string; gyms: { gym_id: string; headline: string; text: string }[] };

async function applyAiSelectedGyms(supabase: ReturnType<typeof createAdminClient>, featureId: string, formData: FormData): Promise<string | null> {
  const raw = (formData.get("ai_gym_sections") as string) || "";
  if (!raw) return null;

  let sections: AiGymSection[];
  try {
    sections = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(sections) || sections.length === 0) return null;

  const rows: { feature_id: string; gym_id: string; comment: string | null; section_label: string | null; headline: string | null; sort_order: number }[] = [];
  let sortOrder = 0;
  for (const section of sections) {
    for (const g of section.gyms ?? []) {
      rows.push({
        feature_id: featureId,
        gym_id: g.gym_id,
        comment: g.text || null,
        section_label: section.area_label || null,
        headline: g.headline || null,
        sort_order: sortOrder++,
      });
    }
  }
  if (rows.length === 0) return null;

  // (feature_id, gym_id)にユニーク制約があるため、新しい内容をinsertする前に古い行を削除する必要がある。
  // そのため、まず古い行の内容を丸ごと退避しておき、insertが失敗した場合はそのまま復元できるようにする。
  const { data: oldRows } = await supabase
    .from("feature_gyms")
    .select("gym_id, comment, section_label, headline, sort_order")
    .eq("feature_id", featureId);

  await supabase.from("feature_gyms").delete().eq("feature_id", featureId);

  const { error: insertError } = await supabase.from("feature_gyms").insert(rows as any);
  if (insertError) {
    if (oldRows && oldRows.length > 0) {
      await supabase.from("feature_gyms").insert(oldRows.map((r: any) => ({ ...r, feature_id: featureId })) as any);
    }
    return `掲載ジムの保存に失敗しました（${insertError.message}）。マイグレーションが未実行の可能性があります。本文・SEO情報は保存されましたが、掲載ジムは更新されていません。`;
  }
  return null;
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

  await applyAiSelectedGyms(supabase, feature.id, formData);

  revalidatePath("/admin/features");
  redirect(`/admin/features/${feature.id}`);
}

export async function updateFeature(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const data = parseFeatureFormData(formData);

  const { error } = await supabase.from("features").update(data as any).eq("id", id);
  if (error) return { error: error.message };

  const gymError = await applyAiSelectedGyms(supabase, id, formData);
  if (gymError) return { error: gymError };

  const { data: feature } = await supabase.from("features").select("slug").eq("id", id).single();
  if (feature?.slug) revalidatePath(`/features/${feature.slug}`);
  revalidatePath("/admin/features");
  revalidatePath("/features");
  return { success: true };
}

export async function updateFeatureStatus(id: string, status: ContentStatus) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("features").update({ status } as any).eq("id", id);
  if (error) throw new Error(error.message);

  const { data: feature } = await supabase.from("features").select("slug").eq("id", id).single();
  if (feature?.slug) revalidatePath(`/features/${feature.slug}`);
  revalidatePath("/admin/features");
  revalidatePath("/features");
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
    section_label: (formData.get("section_label") as string) || null,
    headline: (formData.get("headline") as string) || null,
    sort_order: nextOrder,
  } as any);
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
      section_label: (formData.get("section_label") as string) || null,
      headline: (formData.get("headline") as string) || null,
      sort_order: Number(formData.get("sort_order") ?? 0),
    } as any)
    .eq("id", rowId);
  if (error) throw new Error(error.message);

  const { data: feature } = await supabase.from("features").select("slug").eq("id", featureId).single();
  if (feature?.slug) revalidatePath(`/features/${feature.slug}`);
  revalidatePath(`/admin/features/${featureId}/gyms`);
}

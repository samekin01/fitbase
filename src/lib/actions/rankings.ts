"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentStatus } from "@/types/tables";
import { rankGymsByScore } from "@/lib/ranking-score";

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
    closing_md: (formData.get("closing_md") as string) || null,
    eyecatch_image_url: (formData.get("eyecatch_image_url") as string) || null,
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

export async function uploadRankingThumbnail(rankingId: string, formData: FormData) {
  const supabase = createAdminClient();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) throw new Error("ファイルが選択されていません。");
  if (!file.type.startsWith("image/")) throw new Error("画像ファイルを選択してください。");
  if (file.size > 5 * 1024 * 1024) throw new Error("ファイルサイズは5MB以下にしてください。");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `rankings/${rankingId}-${Date.now()}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from("gym-images")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (storageError) throw new Error(storageError.message);

  const { data: publicUrl } = supabase.storage.from("gym-images").getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("rankings")
    .update({ eyecatch_image_url: publicUrl.publicUrl })
    .eq("id", rankingId);
  if (updateError) throw new Error(updateError.message);

  const { data: ranking } = await supabase.from("rankings").select("slug").eq("id", rankingId).single();
  if (ranking?.slug) revalidatePath(`/rankings/${ranking.slug}`);
  revalidatePath(`/admin/rankings/${rankingId}`);
}

export async function updateRankingStatus(id: string, status: ContentStatus) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("rankings").update({ status } as any).eq("id", id);
  if (error) throw new Error(error.message);

  const { data: ranking } = await supabase.from("rankings").select("slug").eq("id", id).single();
  if (ranking?.slug) revalidatePath(`/rankings/${ranking.slug}`);
  revalidatePath("/admin/rankings");
  revalidatePath("/rankings");
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

export async function autoRankGyms(rankingId: string, formData: FormData) {
  const supabase = createAdminClient();
  const limit = Math.max(1, Number(formData.get("limit")) || 10);

  const { data: ranking } = await supabase
    .from("rankings")
    .select("slug, city_id, prefecture_id")
    .eq("id", rankingId)
    .single();
  if (!ranking) throw new Error("ランキングが見つかりません");

  let query = supabase
    .from("gyms")
    .select("id, google_rating, google_review_count, monthly_fee_min")
    .eq("status", "published");
  if (ranking.city_id) {
    query = query.eq("city_id", ranking.city_id);
  } else if (ranking.prefecture_id) {
    query = query.eq("prefecture_id", ranking.prefecture_id);
  } else {
    throw new Error("ランキングに都道府県または市区町村が設定されていません");
  }

  const { data: candidateGyms } = await query;
  if (!candidateGyms || candidateGyms.length === 0) {
    throw new Error("対象エリアに公開中のジムがありません");
  }

  const ranked = rankGymsByScore(candidateGyms).slice(0, limit);

  await supabase.from("ranking_gyms").delete().eq("ranking_id", rankingId);
  const { error } = await supabase.from("ranking_gyms").insert(
    ranked.map(({ gym }, i) => ({
      ranking_id: rankingId,
      gym_id: gym.id,
      rank: i + 1,
    }))
  );
  if (error) throw new Error(error.message);

  if (ranking.slug) revalidatePath(`/rankings/${ranking.slug}`);
  revalidatePath(`/admin/rankings/${rankingId}/gyms`);
}

export async function bulkGenerateCityRankings(formData: FormData) {
  const supabase = createAdminClient();
  const minGyms = Math.max(1, Number(formData.get("min_gyms")) || 10);
  const perRanking = Math.max(1, Number(formData.get("limit")) || 10);

  const { data: gyms } = await supabase
    .from("gyms")
    .select("id, city_id, google_rating, google_review_count, monthly_fee_min")
    .eq("status", "published")
    .not("city_id", "is", null);

  const byCity = new Map<string, NonNullable<typeof gyms>>();
  for (const g of gyms ?? []) {
    const arr = byCity.get(g.city_id as string) ?? [];
    arr.push(g);
    byCity.set(g.city_id as string, arr);
  }

  const eligibleCityIds = [...byCity.entries()]
    .filter(([, arr]) => arr.length >= minGyms)
    .map(([id]) => id);

  if (eligibleCityIds.length === 0) {
    throw new Error(`${minGyms}件以上の公開ジムがある都市がありません`);
  }

  const { data: existingRankings } = await supabase
    .from("rankings")
    .select("city_id")
    .not("city_id", "is", null);
  const citiesWithRanking = new Set((existingRankings ?? []).map((r: any) => r.city_id));

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug, prefecture_id")
    .in("id", eligibleCityIds);

  for (const city of cities ?? []) {
    if (citiesWithRanking.has(city.id)) continue;

    const cityGyms = byCity.get(city.id) ?? [];
    const ranked = rankGymsByScore(cityGyms).slice(0, perRanking);

    const { data: ranking, error } = await supabase
      .from("rankings")
      .insert({
        title: `${city.name}のパーソナルジムおすすめランキング`,
        slug: `${city.slug}-personal-gym-ranking`,
        city_id: city.id,
        prefecture_id: city.prefecture_id,
        status: "draft",
      } as any)
      .select("id")
      .single();
    if (error || !ranking) continue;

    await supabase.from("ranking_gyms").insert(
      ranked.map(({ gym }, i) => ({ ranking_id: ranking.id, gym_id: gym.id, rank: i + 1 }))
    );
  }

  revalidatePath("/admin/rankings");
}

export async function generateAreaRanking(formData: FormData) {
  const supabase = createAdminClient();
  const prefectureId = formData.get("prefecture_id") as string;
  const cityId = (formData.get("city_id") as string) || "";
  const limit = Math.max(1, Number(formData.get("limit")) || 10);

  if (!prefectureId) throw new Error("都道府県を選択してください");

  let areaName: string;
  let areaSlug: string;
  let resolvedPrefectureId = prefectureId;

  if (cityId) {
    const { data: city } = await supabase
      .from("cities")
      .select("id, name, slug, prefecture_id")
      .eq("id", cityId)
      .single();
    if (!city) throw new Error("市区町村が見つかりません");
    areaName = city.name;
    areaSlug = city.slug;
    resolvedPrefectureId = city.prefecture_id;
  } else {
    const { data: pref } = await supabase
      .from("prefectures")
      .select("id, name, slug")
      .eq("id", prefectureId)
      .single();
    if (!pref) throw new Error("都道府県が見つかりません");
    areaName = pref.name;
    areaSlug = pref.slug;
  }

  const slug = `${areaSlug}-personal-gym-ranking`;
  const { data: existing } = await supabase.from("rankings").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    throw new Error(`「${areaName}」のランキングは既に存在します（既存のものを編集してください）`);
  }

  let gymQuery = supabase
    .from("gyms")
    .select("id, google_rating, google_review_count, monthly_fee_min")
    .eq("status", "published");
  gymQuery = cityId ? gymQuery.eq("city_id", cityId) : gymQuery.eq("prefecture_id", prefectureId);

  const { data: candidateGyms } = await gymQuery;
  if (!candidateGyms || candidateGyms.length === 0) {
    throw new Error(`「${areaName}」に公開中のジムがありません`);
  }

  const ranked = rankGymsByScore(candidateGyms).slice(0, limit);

  const { data: ranking, error } = await supabase
    .from("rankings")
    .insert({
      title: `${areaName}のパーソナルジムおすすめランキング`,
      slug,
      city_id: cityId || null,
      prefecture_id: resolvedPrefectureId,
      status: "draft",
    } as any)
    .select("id")
    .single();
  if (error || !ranking) throw new Error(error?.message ?? "ランキングの作成に失敗しました");

  await supabase.from("ranking_gyms").insert(
    ranked.map(({ gym }, i) => ({ ranking_id: ranking.id, gym_id: gym.id, rank: i + 1 }))
  );

  revalidatePath("/admin/rankings");
  redirect(`/admin/rankings/${ranking.id}`);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const GYM_LIST_SELECT = `
  id, slug, name, address, area_name,
  monthly_fee_min, total_price_min,
  has_trial, is_female_friendly, has_private_room, has_nutrition_support, supports_contest, is_near_station,
  google_rating, google_review_count,
  gym_images(image_url)
` as const;

export function coverImageUrl(gym: any): string | null {
  const imgs = gym.gym_images as Array<{ image_url: string }> | null;
  if (!imgs?.length) return null;
  return imgs[0]?.image_url ?? null;
}

export function toGymSummary(gym: any) {
  return {
    slug: gym.slug,
    name: gym.name,
    address: gym.address,
    area_name: gym.area_name,
    monthly_fee_min: gym.monthly_fee_min,
    total_price_min: gym.total_price_min,
    has_trial: gym.has_trial,
    is_female_friendly: gym.is_female_friendly,
    has_private_room: gym.has_private_room,
    has_nutrition_support: gym.has_nutrition_support,
    supports_contest: gym.supports_contest,
    is_near_station: gym.is_near_station,
    google_rating: gym.google_rating,
    google_review_count: gym.google_review_count,
    image_url: coverImageUrl(gym),
  };
}

export async function getGymBasicBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("gyms")
    .select("id, slug, name")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data as { id: string; slug: string; name: string } | null;
}

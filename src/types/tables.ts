// 主要テーブルの型定義（supabase gen types 生成前の手動定義）

export type GymStatus =
  | "draft"
  | "published"
  | "claim_requested"
  | "verified"
  | "hidden"
  | "delete_requested";

export type GymSource = "manual" | "google_places" | "gym_owner" | "imported";

export type Prefecture = {
  id: string;
  name: string;
  slug: string;
  seo_title: string | null;
  meta_description: string | null;
  intro_text: string | null;
  body_md: string | null;
  faq_json: unknown;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type City = {
  id: string;
  prefecture_id: string;
  name: string;
  slug: string;
  seo_title: string | null;
  meta_description: string | null;
  intro_text: string | null;
  body_md: string | null;
  faq_json: unknown;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Station = {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
};

export type Gym = {
  id: string;
  name: string;
  slug: string;
  prefecture_id: string | null;
  city_id: string | null;
  nearest_station_id: string | null;
  area_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  google_place_id: string | null;
  opening_hours: unknown;
  admission_fee: number | null;
  monthly_fee_min: number | null;
  total_price_min: number | null;
  has_trial: boolean;
  trial_fee: number | null;
  description: string | null;
  recommended_points: string | null;
  target_users: string | null;
  trainer_info: string | null;
  facilities: string | null;
  has_nutrition_support: boolean;
  has_private_room: boolean;
  is_female_friendly: boolean;
  supports_contest: boolean;
  is_near_station: boolean;
  google_rating: number | null;
  google_review_count: number | null;
  status: GymStatus;
  source: GymSource;
  last_checked_at: string | null;
  published_at: string | null;
  published_by: string | null;
  seo_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  noindex: boolean;
  created_at: string;
  updated_at: string;
};

export type GymPlan = {
  id: string;
  gym_id: string;
  name: string;
  sessions: number | null;
  duration_weeks: number | null;
  price: number;
  monthly_equivalent: number | null;
  note: string | null;
  sort_order: number;
  created_at: string;
};

export type GymImage = {
  id: string;
  gym_id: string;
  photo_reference: string | null;
  image_url: string;
  storage_path: string | null;
  source: string;
  attribution: string | null;
  sort_order: number;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  role: "admin" | "editor" | "gym_owner";
  created_at: string;
};

export type ContentStatus = "draft" | "published";

export type Article = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  eyecatch_image_url: string | null;
  body_md: string | null;
  supervisor_name: string | null;
  seo_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  noindex: boolean;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Feature = {
  id: string;
  title: string;
  slug: string;
  prefecture_id: string | null;
  city_id: string | null;
  station_id: string | null;
  category: string | null;
  body_md: string | null;
  faq_json: unknown;
  seo_title: string | null;
  meta_description: string | null;
  sort_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type FeatureGym = {
  id: string;
  feature_id: string;
  gym_id: string;
  sort_order: number;
  comment: string | null;
  created_at: string;
};

export type Ranking = {
  id: string;
  title: string;
  slug: string;
  prefecture_id: string | null;
  city_id: string | null;
  station_id: string | null;
  category: string | null;
  body_md: string | null;
  closing_md: string | null;
  eyecatch_image_url: string | null;
  seo_title: string | null;
  meta_description: string | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type RankingGym = {
  id: string;
  ranking_id: string;
  gym_id: string;
  rank: number;
  reason: string | null;
  created_at: string;
};

-- FitBase: テーブル作成マイグレーション
-- 実行環境: Supabase SQL エディタ（または supabase db push）

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================
-- MASTER TABLES
-- =============================================

CREATE TABLE prefectures (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  seo_title        text,
  meta_description text,
  intro_text       text,
  body_md          text,
  faq_json         jsonb,
  sort_order       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cities (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  prefecture_id    uuid        NOT NULL REFERENCES prefectures(id) ON DELETE RESTRICT,
  name             text        NOT NULL,
  slug             text        NOT NULL,
  seo_title        text,
  meta_description text,
  intro_text       text,
  body_md          text,
  faq_json         jsonb,
  sort_order       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prefecture_id, slug)
);

CREATE TABLE stations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id     uuid        NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  name        text        NOT NULL,
  slug        text        NOT NULL,
  latitude    numeric,
  longitude   numeric,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city_id, slug)
);

-- =============================================
-- AUTH / PROFILES
-- =============================================

CREATE TABLE profiles (
  id           uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  role         text    NOT NULL DEFAULT 'editor'
               CHECK (role IN ('admin', 'editor', 'gym_owner')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'display_name', 'editor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- HELPER FUNCTION（profiles の後に定義）
-- =============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- TAGS
-- =============================================

CREATE TABLE tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        UNIQUE NOT NULL,
  category   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- GYMS
-- =============================================

CREATE TABLE gyms (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text        NOT NULL,
  slug                  text        UNIQUE NOT NULL,
  prefecture_id         uuid        REFERENCES prefectures(id) ON DELETE RESTRICT,
  city_id               uuid        REFERENCES cities(id) ON DELETE RESTRICT,
  nearest_station_id    uuid        REFERENCES stations(id) ON DELETE SET NULL,
  area_name             text,
  address               text,
  latitude              numeric,
  longitude             numeric,
  phone                 text,
  website_url           text,
  google_maps_url       text,
  google_place_id       text        UNIQUE,
  opening_hours         jsonb,
  admission_fee         int,
  monthly_fee_min       int,
  total_price_min       int,
  has_trial             bool        NOT NULL DEFAULT false,
  trial_fee             int,
  description           text,
  recommended_points    text,
  target_users          text,
  trainer_info          text,
  facilities            text,
  has_nutrition_support bool        NOT NULL DEFAULT false,
  has_private_room      bool        NOT NULL DEFAULT false,
  is_female_friendly    bool        NOT NULL DEFAULT false,
  supports_contest      bool        NOT NULL DEFAULT false,
  is_near_station       bool        NOT NULL DEFAULT false,
  google_rating         numeric,
  google_review_count   int,
  status                text        NOT NULL DEFAULT 'draft'
                        CHECK (status IN (
                          'draft','published','claim_requested',
                          'verified','hidden','delete_requested'
                        )),
  source                text        NOT NULL DEFAULT 'manual'
                        CHECK (source IN (
                          'manual','google_places','gym_owner','imported'
                        )),
  last_checked_at       timestamptz,
  published_at          timestamptz,
  published_by          uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  seo_title             text,
  meta_description      text,
  canonical_url         text,
  noindex               bool        NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gyms ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(name,'') || ' ' ||
      coalesce(address,'') || ' ' ||
      coalesce(description,'') || ' ' ||
      coalesce(area_name,'')
    )
  ) STORED;

CREATE INDEX gyms_search_idx       ON gyms USING GIN(search_vector);
CREATE INDEX gyms_status_idx       ON gyms(status);
CREATE INDEX gyms_city_id_idx      ON gyms(city_id);
CREATE INDEX gyms_prefecture_id_idx ON gyms(prefecture_id);
CREATE INDEX gyms_monthly_fee_idx  ON gyms(monthly_fee_min);

CREATE TABLE gym_plans (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id             uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name               text        NOT NULL,
  sessions           int,
  duration_weeks     int,
  price              int         NOT NULL,
  monthly_equivalent int,
  note               text,
  sort_order         int         NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_gym_fee_summary()
RETURNS trigger AS $$
BEGIN
  UPDATE gyms SET
    total_price_min = (
      SELECT MIN(price) FROM gym_plans
      WHERE gym_id = COALESCE(NEW.gym_id, OLD.gym_id)
    ),
    monthly_fee_min = (
      SELECT MIN(COALESCE(monthly_equivalent, price))
      FROM gym_plans
      WHERE gym_id = COALESCE(NEW.gym_id, OLD.gym_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.gym_id, OLD.gym_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gym_plans_fee_update
  AFTER INSERT OR UPDATE OR DELETE ON gym_plans
  FOR EACH ROW EXECUTE FUNCTION update_gym_fee_summary();

CREATE TABLE gym_tags (
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (gym_id, tag_id)
);

CREATE TABLE gym_images (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  photo_reference text,
  image_url       text        NOT NULL,
  storage_path    text,
  source          text        NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('google_places','official_site','gym_owner','manual')),
  attribution     text,
  sort_order      int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- CONTENT TABLES
-- =============================================

CREATE TABLE articles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text        NOT NULL,
  slug               text        UNIQUE NOT NULL,
  category           text,
  eyecatch_image_url text,
  body_md            text,
  supervisor_name    text,
  seo_title          text,
  meta_description   text,
  canonical_url      text,
  noindex            bool        NOT NULL DEFAULT false,
  status             text        NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','published')),
  published_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE features (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  prefecture_id    uuid        REFERENCES prefectures(id) ON DELETE SET NULL,
  city_id          uuid        REFERENCES cities(id) ON DELETE SET NULL,
  station_id       uuid        REFERENCES stations(id) ON DELETE SET NULL,
  category         text,
  body_md          text,
  faq_json         jsonb,
  seo_title        text,
  meta_description text,
  sort_order       int         NOT NULL DEFAULT 0,
  status           text        NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','published')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feature_gyms (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid        NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  gym_id     uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  sort_order int         NOT NULL DEFAULT 0,
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feature_id, gym_id)
);

CREATE TABLE rankings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  prefecture_id    uuid        REFERENCES prefectures(id) ON DELETE SET NULL,
  city_id          uuid        REFERENCES cities(id) ON DELETE SET NULL,
  station_id       uuid        REFERENCES stations(id) ON DELETE SET NULL,
  category         text,
  body_md          text,
  seo_title        text,
  meta_description text,
  status           text        NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','published')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ranking_gyms (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id uuid        NOT NULL REFERENCES rankings(id) ON DELETE CASCADE,
  gym_id     uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  rank       int         NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ranking_id, gym_id)
);

-- =============================================
-- GOOGLE PLACES IMPORT
-- =============================================

CREATE TABLE google_import_jobs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword         text,
  prefecture      text,
  city            text,
  radius          int,
  max_results     int,
  status          text        NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running','done','error')),
  total_results   int         NOT NULL DEFAULT 0,
  new_count       int         NOT NULL DEFAULT 0,
  duplicate_count int         NOT NULL DEFAULT 0,
  error_count     int         NOT NULL DEFAULT 0,
  executed_by     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE google_import_results (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              uuid        NOT NULL REFERENCES google_import_jobs(id) ON DELETE CASCADE,
  google_place_id     text        NOT NULL,
  name                text,
  address             text,
  phone               text,
  website_url         text,
  google_maps_url     text,
  latitude            numeric,
  longitude           numeric,
  google_rating       numeric,
  google_review_count int,
  raw_json            jsonb,
  import_status       text        NOT NULL DEFAULT 'new'
                      CHECK (import_status IN ('new','duplicate','ignored','imported','error')),
  matched_gym_id      uuid        REFERENCES gyms(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- REQUESTS / FORMS
-- =============================================

CREATE TABLE gym_claims (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id       uuid        REFERENCES gyms(id) ON DELETE SET NULL,
  owner_name   text        NOT NULL,
  company_name text,
  email        text        NOT NULL,
  phone        text,
  position     text,
  message      text,
  status       text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gym_update_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id         uuid        REFERENCES gyms(id) ON DELETE SET NULL,
  requester_name text        NOT NULL,
  email          text        NOT NULL,
  message        text        NOT NULL,
  attachment_url text,
  status         text        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','handled','rejected')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gym_delete_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id         uuid        REFERENCES gyms(id) ON DELETE SET NULL,
  requester_name text        NOT NULL,
  email          text        NOT NULL,
  reason         text        NOT NULL,
  status         text        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','handled','rejected')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contacts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  subject    text,
  message    text        NOT NULL,
  status     text        NOT NULL DEFAULT 'unread'
             CHECK (status IN ('unread','read','handled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- updated_at 自動更新トリガー
-- =============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_prefectures  BEFORE UPDATE ON prefectures        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_cities       BEFORE UPDATE ON cities             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_gyms         BEFORE UPDATE ON gyms               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_articles     BEFORE UPDATE ON articles           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_features     BEFORE UPDATE ON features           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_rankings     BEFORE UPDATE ON rankings           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_claims       BEFORE UPDATE ON gym_claims         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_update_reqs  BEFORE UPDATE ON gym_update_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_delete_reqs  BEFORE UPDATE ON gym_delete_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updated_import_jobs  BEFORE UPDATE ON google_import_jobs  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

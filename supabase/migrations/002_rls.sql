-- FitBase: RLS ポリシー定義
-- 全テーブルで RLS を有効化し、anon の直接書き込みを禁止する

-- =============================================
-- RLS 有効化
-- =============================================
ALTER TABLE prefectures          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_images           ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE features             ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_gyms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_gyms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_import_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_import_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_claims           ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_update_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_delete_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts             ENABLE ROW LEVEL SECURITY;

-- =============================================
-- マスタ（エリア・タグ）: 全員読取可、admin のみ書込
-- =============================================
CREATE POLICY "prefectures_public_read" ON prefectures FOR SELECT USING (true);
CREATE POLICY "prefectures_admin_write" ON prefectures FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "cities_public_read"      ON cities      FOR SELECT USING (true);
CREATE POLICY "cities_admin_write"      ON cities      FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "stations_public_read"    ON stations    FOR SELECT USING (true);
CREATE POLICY "stations_admin_write"    ON stations    FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "tags_public_read"        ON tags        FOR SELECT USING (true);
CREATE POLICY "tags_admin_write"        ON tags        FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

-- =============================================
-- PROFILES
-- =============================================
CREATE POLICY "profiles_own_read"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- role の自己変更を禁止: 既存の role と同値しか許可しない
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "profiles_admin_all"  ON profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================
-- GYMS（公開済みのみ anon 読取可）
-- =============================================
CREATE POLICY "gyms_public_read" ON gyms FOR SELECT USING (status = 'published');
CREATE POLICY "gyms_admin_all"   ON gyms FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

-- GYM_PLANS
CREATE POLICY "gym_plans_public_read" ON gym_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM gyms WHERE gyms.id = gym_plans.gym_id AND gyms.status = 'published'));
CREATE POLICY "gym_plans_admin_all"   ON gym_plans FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- GYM_TAGS
CREATE POLICY "gym_tags_public_read"  ON gym_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM gyms WHERE gyms.id = gym_tags.gym_id AND gyms.status = 'published'));
CREATE POLICY "gym_tags_admin_all"    ON gym_tags FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- GYM_IMAGES
CREATE POLICY "gym_images_public_read" ON gym_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM gyms WHERE gyms.id = gym_images.gym_id AND gyms.status = 'published'));
CREATE POLICY "gym_images_admin_all"   ON gym_images FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================
-- CONTENT（公開済みのみ anon 読取可）
-- =============================================
CREATE POLICY "articles_public_read"  ON articles  FOR SELECT USING (status = 'published' AND noindex = false);
CREATE POLICY "articles_admin_all"    ON articles  FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "features_public_read"  ON features  FOR SELECT USING (status = 'published');
CREATE POLICY "features_admin_all"    ON features  FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "feature_gyms_public_read" ON feature_gyms FOR SELECT
  USING (EXISTS (SELECT 1 FROM features WHERE features.id = feature_gyms.feature_id AND features.status = 'published'));
CREATE POLICY "feature_gyms_admin_all"   ON feature_gyms FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rankings_public_read"  ON rankings  FOR SELECT USING (status = 'published');
CREATE POLICY "rankings_admin_all"    ON rankings  FOR ALL    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "ranking_gyms_public_read" ON ranking_gyms FOR SELECT
  USING (EXISTS (SELECT 1 FROM rankings WHERE rankings.id = ranking_gyms.ranking_id AND rankings.status = 'published'));
CREATE POLICY "ranking_gyms_admin_all"   ON ranking_gyms FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================
-- GOOGLE IMPORT（admin のみ）
-- =============================================
CREATE POLICY "import_jobs_admin_all"     ON google_import_jobs    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "import_results_admin_all"  ON google_import_results FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================
-- FORMS（anon 直接書込禁止。service_role 経由のみ許可）
-- service_role は RLS をバイパスするため追加ポリシー不要。
-- admin は CMS からステータス変更・閲覧するためポリシーを追加。
-- =============================================
CREATE POLICY "gym_claims_admin_all"      ON gym_claims           FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "update_reqs_admin_all"     ON gym_update_requests  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "delete_reqs_admin_all"     ON gym_delete_requests  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "contacts_admin_all"        ON contacts             FOR ALL USING (is_admin()) WITH CHECK (is_admin());

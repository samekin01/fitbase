-- FitBase: 営業パイプライン拡張
-- 1. ステージに「アポ獲得」を追加（アプローチ中 と 商談中 の間）
-- 2. 見送り理由・次回アクション内容を追加
-- 3. アプローチ履歴テーブルを追加し、記録するたびにapproach_countを自動加算

ALTER TABLE sales_leads DROP CONSTRAINT sales_leads_stage_check;
ALTER TABLE sales_leads ADD CONSTRAINT sales_leads_stage_check
  CHECK (stage IN ('not_started','approaching','appointment_set','negotiating','won','lost'));

ALTER TABLE sales_leads ADD COLUMN lost_reason text
  CHECK (lost_reason IN ('price','timing','competitor','no_effect','other'));

ALTER TABLE sales_leads ADD COLUMN next_action text;

CREATE TABLE sales_lead_activities (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  activity_date date        NOT NULL DEFAULT CURRENT_DATE,
  content       text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sales_lead_activities_gym_id_idx ON sales_lead_activities (gym_id);

ALTER TABLE sales_lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_lead_activities_admin_all" ON sales_lead_activities FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION bump_approach_count()
RETURNS trigger AS $$
BEGIN
  INSERT INTO sales_leads (gym_id, approach_count)
  VALUES (NEW.gym_id, 1)
  ON CONFLICT (gym_id) DO UPDATE SET approach_count = sales_leads.approach_count + 1, updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bump_approach_count AFTER INSERT ON sales_lead_activities
FOR EACH ROW EXECUTE FUNCTION bump_approach_count();

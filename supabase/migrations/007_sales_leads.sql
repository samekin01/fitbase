-- FitBase: 公開中ジムへの営業（有料プラン・別サービス提案）パイプライン管理

CREATE TABLE sales_leads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id            uuid        NOT NULL UNIQUE REFERENCES gyms(id) ON DELETE CASCADE,
  stage             text        NOT NULL DEFAULT 'not_started'
                     CHECK (stage IN ('not_started','approaching','negotiating','won','lost')),
  is_rep            text,
  fs_rep            text,
  approach_count    integer     NOT NULL DEFAULT 0,
  approach_result   text,
  negotiation_notes text,
  memo              text,
  follow_up_date    date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sales_leads_stage_idx  ON sales_leads (stage);
CREATE INDEX sales_leads_is_rep_idx ON sales_leads (is_rep);
CREATE INDEX sales_leads_fs_rep_idx ON sales_leads (fs_rep);

ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_leads_admin_all" ON sales_leads FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_updated_sales_leads BEFORE UPDATE ON sales_leads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

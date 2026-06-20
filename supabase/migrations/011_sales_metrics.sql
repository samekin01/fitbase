-- FitBase: 営業の数値管理（アクション数、各種転換率、契約単価）
-- 1. 成約時の契約単価を記録できるようにする
-- 2. ステージの遷移履歴を記録し、「アポ獲得率」「商談実行率」「成約率」を
--    現在のステージに関わらず正しく集計できるようにする

ALTER TABLE sales_leads ADD COLUMN contract_amount numeric;

CREATE TABLE sales_lead_stage_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id     uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  stage      text        NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sales_lead_stage_history_gym_id_idx ON sales_lead_stage_history (gym_id);
CREATE INDEX sales_lead_stage_history_stage_idx  ON sales_lead_stage_history (stage);

ALTER TABLE sales_lead_stage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_lead_stage_history_admin_all" ON sales_lead_stage_history FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION log_sales_lead_stage()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO sales_lead_stage_history (gym_id, stage) VALUES (NEW.gym_id, NEW.stage);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_sales_lead_stage AFTER INSERT OR UPDATE OF stage ON sales_leads
FOR EACH ROW EXECUTE FUNCTION log_sales_lead_stage();

-- 既存リードは現在のステージを起点として履歴に記録する
-- （これより前の遷移は記録が無いため、集計は本日以降の遷移から正確になる）
INSERT INTO sales_lead_stage_history (gym_id, stage)
SELECT gym_id, stage FROM sales_leads;

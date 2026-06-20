-- FitBase: アプローチ履歴を削除した際にapproach_countを連動して減算する

CREATE OR REPLACE FUNCTION decrement_approach_count()
RETURNS trigger AS $$
BEGIN
  UPDATE sales_leads SET approach_count = GREATEST(approach_count - 1, 0), updated_at = now()
  WHERE gym_id = OLD.gym_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_approach_count AFTER DELETE ON sales_lead_activities
FOR EACH ROW EXECUTE FUNCTION decrement_approach_count();

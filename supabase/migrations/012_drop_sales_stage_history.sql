-- FitBase: アポ獲得率等は「現在のステージ件数」をリアルタイム集計する方式に変更したため、
-- 履歴テーブル方式（011で追加）は不要になった。ステージを戻した際に数値が
-- 追従しない問題があったため、現在のステージ件数ベースの集計に統一する。

DROP TRIGGER IF EXISTS trg_log_sales_lead_stage ON sales_leads;
DROP FUNCTION IF EXISTS log_sales_lead_stage();
DROP TABLE IF EXISTS sales_lead_stage_history;

-- FitBase: 営業担当者マスタ（IS担当・FS担当）

CREATE TABLE sales_reps (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  role       text        NOT NULL DEFAULT 'both' CHECK (role IN ('is','fs','both')),
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_reps_admin_all" ON sales_reps FOR ALL USING (is_admin()) WITH CHECK (is_admin());

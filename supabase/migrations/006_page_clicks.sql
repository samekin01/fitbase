-- FitBase: クリックヒートマップ用のクリック座標記録テーブル
-- 個人を特定する情報（IP・Cookie・ユーザーID等）は保存しない

CREATE TABLE page_clicks (
  id             bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path           text        NOT NULL,
  x_pct          numeric     NOT NULL CHECK (x_pct >= 0 AND x_pct <= 100),
  y_pct          numeric     NOT NULL CHECK (y_pct >= 0 AND y_pct <= 100),
  doc_height     integer     NOT NULL,
  viewport_width integer     NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX page_clicks_path_idx ON page_clicks (path);
CREATE INDEX page_clicks_created_at_idx ON page_clicks (created_at);

ALTER TABLE page_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_clicks_admin_all" ON page_clicks FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ページ別のクリック件数（多い順）を返す集計関数
CREATE OR REPLACE FUNCTION get_top_clicked_paths(days_back integer DEFAULT 28, limit_count integer DEFAULT 30)
RETURNS TABLE(path text, click_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT path, count(*) AS click_count
  FROM page_clicks
  WHERE created_at >= now() - (days_back || ' days')::interval
  GROUP BY path
  ORDER BY click_count DESC
  LIMIT limit_count;
$$;

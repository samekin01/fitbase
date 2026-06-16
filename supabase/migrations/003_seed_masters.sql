-- FitBase: マスタデータ初期投入
-- 東海4県の都道府県マスタ

INSERT INTO prefectures (name, slug, seo_title, meta_description, sort_order) VALUES
  ('愛知県', 'aichi',    '愛知県のパーソナルジム一覧 | FitBase',    '愛知県のパーソナルジムを料金・エリア・特徴で比較。名古屋・豊橋・岡崎・豊田のジムを網羅。', 1),
  ('岐阜県', 'gifu',     '岐阜県のパーソナルジム一覧 | FitBase',    '岐阜県のパーソナルジムを料金・エリア・特徴で比較。岐阜・大垣・各務原のジムを網羅。',     2),
  ('三重県', 'mie',      '三重県のパーソナルジム一覧 | FitBase',    '三重県のパーソナルジムを料金・エリア・特徴で比較。津・四日市・伊勢のジムを網羅。',       3),
  ('静岡県', 'shizuoka', '静岡県のパーソナルジム一覧 | FitBase',    '静岡県のパーソナルジムを料金・エリア・特徴で比較。静岡・浜松・沼津のジムを網羅。',       4);

-- 愛知県の主要市区町村
INSERT INTO cities (prefecture_id, name, slug, seo_title, meta_description, sort_order)
SELECT p.id, c.name, c.slug, c.seo_title, c.meta_description, c.sort_order
FROM prefectures p
CROSS JOIN (VALUES
  ('名古屋市', 'nagoya',    '名古屋市のパーソナルジム一覧 | FitBase',  '名古屋市のパーソナルジムを料金・エリア・特徴で比較。',  1),
  ('豊橋市',   'toyohashi', '豊橋市のパーソナルジム一覧 | FitBase',    '豊橋市のパーソナルジムを料金・エリア・特徴で比較。',    2),
  ('岡崎市',   'okazaki',   '岡崎市のパーソナルジム一覧 | FitBase',    '岡崎市のパーソナルジムを料金・エリア・特徴で比較。',    3),
  ('豊田市',   'toyota',    '豊田市のパーソナルジム一覧 | FitBase',    '豊田市のパーソナルジムを料金・エリア・特徴で比較。',    4),
  ('一宮市',   'ichinomiya','一宮市のパーソナルジム一覧 | FitBase',    '一宮市のパーソナルジムを料金・エリア・特徴で比較。',    5),
  ('春日井市', 'kasugai',   '春日井市のパーソナルジム一覧 | FitBase',  '春日井市のパーソナルジムを料金・エリア・特徴で比較。',  6)
) AS c(name, slug, seo_title, meta_description, sort_order)
WHERE p.slug = 'aichi';

-- 岐阜県の主要市区町村
INSERT INTO cities (prefecture_id, name, slug, seo_title, meta_description, sort_order)
SELECT p.id, c.name, c.slug, c.seo_title, c.meta_description, c.sort_order
FROM prefectures p
CROSS JOIN (VALUES
  ('岐阜市',   'gifu',      '岐阜市のパーソナルジム一覧 | FitBase',   '岐阜市のパーソナルジムを料金・エリア・特徴で比較。',   1),
  ('大垣市',   'ogaki',     '大垣市のパーソナルジム一覧 | FitBase',   '大垣市のパーソナルジムを料金・エリア・特徴で比較。',   2),
  ('各務原市', 'kakamigahara','各務原市のパーソナルジム一覧 | FitBase','各務原市のパーソナルジムを料金・エリア・特徴で比較。', 3)
) AS c(name, slug, seo_title, meta_description, sort_order)
WHERE p.slug = 'gifu';

-- 三重県の主要市区町村
INSERT INTO cities (prefecture_id, name, slug, seo_title, meta_description, sort_order)
SELECT p.id, c.name, c.slug, c.seo_title, c.meta_description, c.sort_order
FROM prefectures p
CROSS JOIN (VALUES
  ('津市',     'tsu',       '津市のパーソナルジム一覧 | FitBase',     '津市のパーソナルジムを料金・エリア・特徴で比較。',     1),
  ('四日市市', 'yokkaichi', '四日市市のパーソナルジム一覧 | FitBase', '四日市市のパーソナルジムを料金・エリア・特徴で比較。', 2),
  ('伊勢市',   'ise',       '伊勢市のパーソナルジム一覧 | FitBase',   '伊勢市のパーソナルジムを料金・エリア・特徴で比較。',   3)
) AS c(name, slug, seo_title, meta_description, sort_order)
WHERE p.slug = 'mie';

-- 静岡県の主要市区町村
INSERT INTO cities (prefecture_id, name, slug, seo_title, meta_description, sort_order)
SELECT p.id, c.name, c.slug, c.seo_title, c.meta_description, c.sort_order
FROM prefectures p
CROSS JOIN (VALUES
  ('静岡市',   'shizuoka',  '静岡市のパーソナルジム一覧 | FitBase',   '静岡市のパーソナルジムを料金・エリア・特徴で比較。',   1),
  ('浜松市',   'hamamatsu', '浜松市のパーソナルジム一覧 | FitBase',   '浜松市のパーソナルジムを料金・エリア・特徴で比較。',   2),
  ('沼津市',   'numazu',    '沼津市のパーソナルジム一覧 | FitBase',   '沼津市のパーソナルジムを料金・エリア・特徴で比較。',   3)
) AS c(name, slug, seo_title, meta_description, sort_order)
WHERE p.slug = 'shizuoka';

-- タグ初期データ
INSERT INTO tags (name, slug, category) VALUES
  ('ダイエット特化',   'diet',         'goal'),
  ('ボディメイク',     'body-make',    'goal'),
  ('産後ケア',         'postnatal',    'target'),
  ('リハビリ',         'rehab',        'target'),
  ('高齢者対応',       'senior',       'target'),
  ('学生向け',         'student',      'target'),
  ('初心者歓迎',       'beginner',     'level'),
  ('オンライン指導あり','online',       'feature'),
  ('24時間営業',       '24h',          'feature'),
  ('駐車場あり',       'parking',      'facility');

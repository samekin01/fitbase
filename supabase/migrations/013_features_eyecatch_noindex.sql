-- FitBase: 特集記事にアイキャッチ画像とnoindexを追加（記事・ランキングと同様の構成に統一）

ALTER TABLE features ADD COLUMN eyecatch_image_url text;
ALTER TABLE features ADD COLUMN noindex boolean NOT NULL DEFAULT false;

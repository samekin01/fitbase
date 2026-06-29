-- 特集記事内でジムをエリア見出し(h2)ごとにグループ化し、ジムごとに見出し(h3相当)を
-- 付けて記事中の文脈に直接カードを挿入できるようにするための列。
ALTER TABLE feature_gyms ADD COLUMN section_label text;
ALTER TABLE feature_gyms ADD COLUMN headline text;

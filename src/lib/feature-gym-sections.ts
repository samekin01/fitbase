// feature_gymsの行（sort_order順）を、AIが付与したsection_label（エリア見出し）でグループ化する。
// section_labelが無い行（手動追加分など）は見出し無しの1グループにまとめる。
export type FeatureGymRow = {
  sort_order: number;
  comment: string | null;
  section_label: string | null;
  headline: string | null;
  gyms: any;
};

export type FeatureGymGroup = {
  area_label: string | null;
  rows: FeatureGymRow[];
};

export function groupFeatureGymRows(rows: FeatureGymRow[]): FeatureGymGroup[] {
  const groups: FeatureGymGroup[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.area_label === row.section_label) {
      last.rows.push(row);
    } else {
      groups.push({ area_label: row.section_label, rows: [row] });
    }
  }
  return groups;
}

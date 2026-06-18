import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GUN_TO_CITY } from "@/lib/gun-to-city";
import { fetchAllRows } from "@/lib/supabase/paginate";

const TOKAI_PREF_CODES = new Set(["21", "22", "23", "24"]);
const PREF_CODE_TO_SLUG: Record<string, string> = {
  "21": "gifu",
  "22": "shizuoka",
  "23": "aichi",
  "24": "mie",
};
const PREF_NAMES: Record<string, string> = {
  aichi: "愛知",
  gifu: "岐阜",
  mie: "三重",
  shizuoka: "静岡",
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuote = !inQuote; }
    else if (c === "," && !inQuote) { result.push(current); current = ""; }
    else { current += c; }
  }
  result.push(current);
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });

    const text = await file.text();
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

    // ヘッダー行（BOM対応）
    const rawHeader = lines[0].replace(/^﻿/, "");
    const header = parseCSVLine(rawHeader).map((h) => h.trim());

    const idx = {
      station_cd: header.indexOf("station_cd"),
      station_name: header.indexOf("station_name"),
      pref_cd: header.indexOf("pref_cd"),
      address: header.indexOf("address"),
      lon: header.indexOf("lon"),
      lat: header.indexOf("lat"),
      e_status: header.indexOf("e_status"),
    };

    if (idx.station_cd < 0 || idx.station_name < 0) {
      return NextResponse.json(
        { error: "CSVフォーマットが正しくありません（station_cd, station_name 列が見つかりません）" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 市区町村マップ:
    //   nameMap: {prefSlug}:{city名}   → city_id
    //   slugMap: {prefSlug}:{city slug} → city_id
    const { data: cities } = await supabase
      .from("cities")
      .select("id, name, slug, prefectures(slug)");

    const nameMap = new Map<string, string>();
    const slugMap = new Map<string, string>();
    const firstCityByPref = new Map<string, string>();

    for (const city of cities ?? []) {
      const prefSlug = (city as any).prefectures?.slug;
      if (!prefSlug) continue;
      nameMap.set(`${prefSlug}:${city.name}`, city.id);
      slugMap.set(`${prefSlug}:${city.slug}`, city.id);
      if (!firstCityByPref.has(prefSlug)) firstCityByPref.set(prefSlug, city.id);
    }

    // 既存スラッグ
    const existingRows = await fetchAllRows((from, to) =>
      supabase.from("stations").select("slug").range(from, to)
    );
    const existingSlugs = new Set(existingRows.map((s: any) => s.slug));

    const toInsert: any[] = [];
    let skippedClosed = 0;
    let skippedExisting = 0;
    const insertedByPref: Record<string, number> = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = parseCSVLine(line);
      const pref_cd = parts[idx.pref_cd]?.trim();
      if (!TOKAI_PREF_CODES.has(pref_cd)) continue;

      // 廃駅スキップ（e_status=1 は廃止）
      if (idx.e_status >= 0 && parts[idx.e_status]?.trim() === "1") {
        skippedClosed++;
        continue;
      }

      const station_cd = parts[idx.station_cd]?.trim();
      const station_name = parts[idx.station_name]?.trim();
      if (!station_cd || !station_name) continue;

      const slug = `sta-${station_cd}`;
      if (existingSlugs.has(slug)) { skippedExisting++; continue; }

      const prefSlug = PREF_CODE_TO_SLUG[pref_cd];
      const address = idx.address >= 0 ? (parts[idx.address]?.trim() ?? "") : "";
      const lon = idx.lon >= 0 ? parseFloat(parts[idx.lon]?.trim() || "0") : 0;
      const lat = idx.lat >= 0 ? parseFloat(parts[idx.lat]?.trim() || "0") : 0;

      // ── city_id の解決（3段階） ──
      let city_id: string | null = null;

      // ① 住所から「○○市」を直接抽出
      //    例: "愛知県名古屋市中村区..." → "名古屋市"
      const cityMatch = address.match(/([^\s都道府県]+市)/);
      if (cityMatch) {
        city_id = nameMap.get(`${prefSlug}:${cityMatch[1]}`) ?? null;
      }

      // ② 「○○郡」から郡→市マッピングで解決
      //    例: "愛知県知多郡阿久比町..." → "知多郡" → citySlug "chita"
      if (!city_id) {
        const gunMatch = address.match(/([^\s都道府県]+郡)/);
        if (gunMatch) {
          const citySlug = GUN_TO_CITY[`${prefSlug}:${gunMatch[1]}`];
          if (citySlug) {
            city_id = slugMap.get(`${prefSlug}:${citySlug}`) ?? null;
          }
        }
      }

      // ③ フォールバック: 県の先頭登録市
      if (!city_id) city_id = firstCityByPref.get(prefSlug) ?? null;

      if (!city_id) { skippedExisting++; continue; }

      toInsert.push({
        name: station_name,
        slug,
        city_id,
        latitude: lat || null,
        longitude: lon || null,
        sort_order: 99,
      });
      existingSlugs.add(slug);
      insertedByPref[prefSlug] = (insertedByPref[prefSlug] ?? 0) + 1;
    }

    // 100件ずつバッチ挿入
    let inserted = 0;
    const BATCH = 100;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const { error } = await supabase.from("stations").insert(batch as any);
      if (!error) inserted += batch.length;
    }

    const skipped = skippedClosed + skippedExisting;
    const byPref = Object.entries(insertedByPref).map(([slug, count]) => ({
      name: PREF_NAMES[slug] ?? slug,
      count,
    }));

    return NextResponse.json({ inserted, skipped, skippedClosed, skippedExisting, total: inserted + skipped, byPref });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

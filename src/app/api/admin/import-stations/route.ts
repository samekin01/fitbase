import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKAI_PREF_CODES = new Set(["21", "22", "23", "24"]);
const PREF_CODE_TO_SLUG: Record<string, string> = {
  "21": "gifu",
  "22": "shizuoka",
  "23": "aichi",
  "24": "mie",
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

    // ヘッダー行を取得（BOM対応）
    const rawHeader = lines[0].replace(/^﻿/, "");
    const header = parseCSVLine(rawHeader).map((h) => h.trim());

    const idx = {
      station_cd: header.indexOf("station_cd"),
      station_name: header.indexOf("station_name"),
      station_name_r: header.indexOf("station_name_r"),
      pref_cd: header.indexOf("pref_cd"),
      address: header.indexOf("address"),
      lon: header.indexOf("lon"),
      lat: header.indexOf("lat"),
      e_status: header.indexOf("e_status"),
    };

    if (idx.station_cd < 0 || idx.station_name < 0) {
      return NextResponse.json({ error: "CSVフォーマットが正しくありません（station_cd, station_name 列が見つかりません）" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 市区町村マップ: {prefSlug}:{city名} → city_id
    const { data: cities } = await supabase
      .from("cities")
      .select("id, name, prefectures(slug)");
    const cityMap = new Map<string, string>();
    const firstCityByPref = new Map<string, string>();
    for (const city of cities ?? []) {
      const prefSlug = (city as any).prefectures?.slug;
      if (!prefSlug) continue;
      cityMap.set(`${prefSlug}:${city.name}`, city.id);
      if (!firstCityByPref.has(prefSlug)) firstCityByPref.set(prefSlug, city.id);
    }

    // 既存スラッグ
    const { data: existingRows } = await supabase.from("stations").select("slug");
    const existingSlugs = new Set((existingRows ?? []).map((s: any) => s.slug));

    const toInsert: any[] = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = parseCSVLine(line);
      const pref_cd = parts[idx.pref_cd]?.trim();
      if (!TOKAI_PREF_CODES.has(pref_cd)) continue;

      // 廃駅をスキップ（e_status=1 は廃止）
      if (idx.e_status >= 0) {
        const e_status = parts[idx.e_status]?.trim();
        if (e_status === "1") { skipped++; continue; }
      }

      const station_cd = parts[idx.station_cd]?.trim();
      const station_name = parts[idx.station_name]?.trim();
      const address = idx.address >= 0 ? parts[idx.address]?.trim() ?? "" : "";
      const lon = idx.lon >= 0 ? parseFloat(parts[idx.lon]?.trim() || "0") : 0;
      const lat = idx.lat >= 0 ? parseFloat(parts[idx.lat]?.trim() || "0") : 0;

      if (!station_cd || !station_name) continue;

      const slug = `sta-${station_cd}`;
      if (existingSlugs.has(slug)) { skipped++; continue; }

      const prefSlug = PREF_CODE_TO_SLUG[pref_cd];

      // 住所から市区町村名を抽出して city_id を解決
      let city_id: string | null = null;
      const cityMatch = address.match(/([^\s都道府県]+?(?:市|町|村))/);
      if (cityMatch) {
        city_id = cityMap.get(`${prefSlug}:${cityMatch[1]}`) ?? null;
      }
      if (!city_id) city_id = firstCityByPref.get(prefSlug) ?? null;
      if (!city_id) { skipped++; continue; }

      toInsert.push({
        name: station_name,
        slug,
        city_id,
        latitude: lat || null,
        longitude: lon || null,
        sort_order: 99,
      });
      existingSlugs.add(slug);
    }

    // 100件ずつ挿入
    let inserted = 0;
    const BATCH = 100;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      const { error } = await supabase.from("stations").insert(batch as any);
      if (!error) inserted += batch.length;
    }

    return NextResponse.json({ inserted, skipped, total: toInsert.length + skipped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

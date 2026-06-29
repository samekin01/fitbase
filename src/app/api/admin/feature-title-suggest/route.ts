import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY が未設定です" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const prefectureId: string = (body.prefectureId ?? "").trim();
  const cityId: string = (body.cityId ?? "").trim();
  const stationId: string = (body.stationId ?? "").trim();
  const prefectureName: string = (body.prefectureName ?? "").trim();
  const cityName: string = (body.cityName ?? "").trim();
  const stationName: string = (body.stationName ?? "").trim();
  const areaName = stationName || cityName || prefectureName || "東海エリア";

  const admin = createAdminClient();

  // 既存特集と重複しないよう、同エリア・全体の既存タイトルを取得
  const { data: existingFeatures } = await admin
    .from("features")
    .select("title, prefecture_id, city_id, station_id")
    .limit(200);
  const existingTitles = (existingFeatures ?? []).map((f: any) => f.title).filter(Boolean);

  // そのエリアにあるジムの特徴タグから、実在する切り口をAIに渡す
  // area_nameは未入力運用のため使わず、prefecture_id/city_id/nearest_station_idで絞り込む（駅 > 市区町村 > 都道府県の優先順）。
  let featureTagsText = "なし";
  if (stationId || cityId || prefectureId) {
    let gymsQuery = admin
      .from("gyms")
      .select("is_female_friendly, has_private_room, has_nutrition_support, has_trial, supports_contest")
      .eq("status", "published")
      .limit(50);
    if (stationId) gymsQuery = gymsQuery.eq("nearest_station_id", stationId);
    else if (cityId) gymsQuery = gymsQuery.eq("city_id", cityId);
    else if (prefectureId) gymsQuery = gymsQuery.eq("prefecture_id", prefectureId);
    const { data: gyms } = await gymsQuery;
    if (gyms && gyms.length > 0) {
      const counts = {
        女性専用: gyms.filter((g: any) => g.is_female_friendly).length,
        完全個室: gyms.filter((g: any) => g.has_private_room).length,
        食事指導あり: gyms.filter((g: any) => g.has_nutrition_support).length,
        無料体験あり: gyms.filter((g: any) => g.has_trial).length,
        コンテスト対応: gyms.filter((g: any) => g.supports_contest).length,
      };
      featureTagsText = Object.entries(counts)
        .filter(([, c]) => c > 0)
        .map(([label, c]) => `${label}（${c}件）`)
        .join("、") || "なし";
    }
  }

  const prompt = `あなたはパーソナルジム紹介メディア「FitBase」の編集者です。
新しい特集記事のタイトル案を考えてください。

【対象エリア】${areaName}
【このエリアの該当ジムの特徴傾向】${featureTagsText}
【既存の特集タイトル（これらと似たテーマ・似た文言は避けること）】
${existingTitles.length > 0 ? existingTitles.map((t) => `・${t}`).join("\n") : "（まだ特集記事なし）"}

読者の検索意図に応えられる、具体的で魅力的な特集タイトルを5つ提案してください。
「女性向け」「初心者向け」「駅近」「コスパ重視」「完全個室」「無料体験」のような切り口の中から、上記の特徴傾向に実際に当てはまるものを優先してください。
既存タイトルと内容・文言が重複しないようにしてください。
各タイトルには合うカテゴリ名（例: 女性向け特集、初心者向け特集、駅近特集）と、なぜこのテーマが良いかの一言理由も付けてください。`;

  let suggestions: { title: string; category: string; reason: string }[];
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      tools: [
        {
          name: "submit_title_suggestions",
          description: "特集タイトルの候補を送信する",
          input_schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                description: "タイトル候補（5件）",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "特集タイトル（25〜35文字程度）" },
                    category: { type: "string", description: "カテゴリ名（10文字程度）" },
                    reason: { type: "string", description: "このテーマが良い理由（40文字程度）" },
                  },
                  required: ["title", "category", "reason"],
                },
              },
            },
            required: ["suggestions"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_title_suggestions" },
      messages: [{ role: "user", content: prompt }],
    });
    const toolUse = message.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!toolUse) throw new Error("ツール呼び出しが見つかりません");
    const input = toolUse.input as { suggestions?: any[] };
    suggestions = Array.isArray(input.suggestions) ? input.suggestions : [];
  } catch (e: any) {
    return NextResponse.json({ error: `AI生成失敗: ${e.message}` }, { status: 500 });
  }

  return NextResponse.json({ suggestions });
}

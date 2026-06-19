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
  const gymId: string = body.gymId ?? "";
  if (!gymId) return NextResponse.json({ error: "gymId は必須です" }, { status: 400 });

  const admin = createAdminClient();

  const { data: gym } = await admin
    .from("gyms")
    .select("id, name, address, website_url, description, status")
    .eq("id", gymId)
    .single();
  if (!gym) return NextResponse.json({ error: "ジムが見つかりません" }, { status: 404 });

  const prompt = `あなたはパーソナルトレーニングジム専門の検索メディア「FitBase」のデータ担当者です。
Google Places等から自動収集した以下の店舗データが、本当に「パーソナルトレーニングジム（trainerが付くマンツーマン形式の運動・フィットネス施設）」かどうかを判定してください。

耳つぼダイエット、よもぎ蒸し、エステ・痩身サロン、マッサージ・整体、ネイルサロン、美容サロンなど、運動・筋力トレーニングを主体としない施設はすべて「パーソナルトレーニングジムではない」と判定してください。
判断に迷う場合（24時間ジム、ピラティス専門スタジオ、ストレッチ専門店など運動を伴う施設）は基本的に「ジムである」側に判定してください。

【店舗名】${gym.name}
【住所】${gym.address ?? "不明"}
【公式サイト】${gym.website_url ?? "不明"}
【説明文】${gym.description ?? "なし"}`;

  let isGym = true;
  let reason = "";
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      tools: [
        {
          name: "submit_classification",
          description: "店舗がパーソナルトレーニングジムかどうかの判定を送信する",
          input_schema: {
            type: "object",
            properties: {
              is_personal_gym: { type: "boolean", description: "パーソナルトレーニングジムであればtrue、そうでなければfalse" },
              reason: { type: "string", description: "判定理由（40文字程度の短い説明）" },
            },
            required: ["is_personal_gym", "reason"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_classification" },
      messages: [{ role: "user", content: prompt }],
    });
    const toolUse = message.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!toolUse) throw new Error("ツール呼び出しが見つかりません");
    const result = toolUse.input as { is_personal_gym: boolean; reason: string };
    isGym = result.is_personal_gym;
    reason = result.reason;
  } catch (e: any) {
    return NextResponse.json({ error: `判定失敗: ${e.message}` }, { status: 500 });
  }

  if (!isGym && gym.status === "draft") {
    const { error: updateError } = await admin
      .from("gyms")
      .update({ status: "hidden" })
      .eq("id", gymId)
      .eq("status", "draft");
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, isGym, reason });
}

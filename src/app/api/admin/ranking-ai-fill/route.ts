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
  const rankingId: string = body.rankingId ?? "";
  if (!rankingId) return NextResponse.json({ error: "rankingId は必須です" }, { status: 400 });

  const admin = createAdminClient();

  const { data: ranking, error: rankingError } = await admin
    .from("rankings")
    .select("id, title, prefectures(name), cities(name)")
    .eq("id", rankingId)
    .single();
  if (rankingError || !ranking) {
    return NextResponse.json({ error: "ランキングが見つかりません" }, { status: 404 });
  }

  const { data: rankingGyms } = await admin
    .from("ranking_gyms")
    .select("id, rank, gyms(name, area_name, address, google_rating, google_review_count, monthly_fee_min, has_trial, is_female_friendly, has_private_room, has_nutrition_support)")
    .eq("ranking_id", rankingId)
    .order("rank", { ascending: false });

  if (!rankingGyms || rankingGyms.length === 0) {
    return NextResponse.json({ error: "ランクインしているジムがありません" }, { status: 422 });
  }

  const areaName = (ranking.cities as any)?.name ?? (ranking.prefectures as any)?.name ?? "東海エリア";

  // 紹介文はランキング記事として「○位から1位へ」のカウントダウン形式で読む想定のため、
  // 順位の高い方（数字が大きい方）から先にAIへ渡す
  const gymListText = rankingGyms
    .map((row: any) => {
      const g = row.gyms;
      const features = [
        g?.is_female_friendly && "女性専用",
        g?.has_private_room && "完全個室",
        g?.has_nutrition_support && "食事指導あり",
        g?.has_trial && "無料体験あり",
      ].filter(Boolean).join("・");
      return `${row.rank}位 ${g?.name}（Google評価${g?.google_rating ?? "不明"}・レビュー${g?.google_review_count ?? 0}件、月額${g?.monthly_fee_min ? `${g.monthly_fee_min}円〜` : "不明"}${features ? `、${features}` : ""}）`;
    })
    .join("\n");

  const prompt = `あなたはパーソナルジム紹介メディア「FitBase」のライターです。
以下の情報をもとに、「${areaName}のパーソナルジムおすすめランキング」記事用のSEOコンテンツをJSON形式で出力してください。
ランキングの算出にはGoogle評価（レビュー数で信頼度補正）と月額料金を加味した社内スコアを使っていますが、この具体的な計算方法・比率・配点は記事内では一切明かさないでください。
導入文で選定基準に触れる場合は「FitBase独自の基準に基づき」のような表現に留め、評価が何%・料金が何%といった内訳は書かないでください。
誇大表現や断定的な医療・効果効能の主張は避けてください。

文章はAIが書いたような硬さ・テンプレート感を避け、人間のライターが書いたような自然な文章にしてください。
具体的には: 「〜でしょう」「〜と言えるでしょう」「ぜひ参考にしてみてください」のような定型的なAI口調を多用しない、一文の長さに変化をつける、体言止めや短い文を交えて単調にならないようにする、不要な前置きや言い換えの繰り返しを避ける、といったことを意識してください。
「！」も適度に使って感情のこもった自然な文章にしてください。ただし多用しすぎると軽い印象になるので、1段落につき1箇所程度を目安にしてください。

この記事は「${rankingGyms.length}位から1位までを順番に紹介していくカウントダウン形式」の記事です。
本文（body_md）には導入文だけを書き、各ジムの紹介文は別フィールド（gym_reasons）に出力してください
（ページ側で「導入文 → ${rankingGyms.length}位の紹介 → ... → 1位の紹介 → クロージング文」の順に自動で組み立てます）。

【エリア】${areaName}
【ランクイン店舗（${rankingGyms.length}位から1位の順）】
${gymListText}

gym_reasonsは掲載されている${rankingGyms.length}件すべてに対して出力してください。`;

  let generated: Record<string, any>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [
        {
          name: "submit_ranking_content",
          description: "ランキング記事のSEOコンテンツを送信する",
          input_schema: {
            type: "object",
            properties: {
              seo_title: { type: "string", description: `SEOタイトル（30〜50文字、「${areaName}のパーソナルジムおすすめランキング○選」のような形式）` },
              meta_description: { type: "string", description: "メタディスクリプション（80〜120文字）" },
              body_md: {
                type: "string",
                description: `導入文のみ（300〜500文字程度の自然な日本語、Markdown見出しなしの本文のみ。これから${rankingGyms.length}位から1位まで順に紹介していくことが分かるように書く。選定基準は「FitBase独自の基準に基づき」とだけ触れ、具体的な計算方法・比率は書かない。${areaName}でジムを選ぶ際のポイントも触れつつ、AIっぽい定型文ではなく人間のライターらしい自然な文章にする）`,
              },
              gym_reasons: {
                type: "array",
                description: `掲載されている${rankingGyms.length}件すべてに対する紹介文`,
                items: {
                  type: "object",
                  properties: {
                    rank: { type: "number", description: "順位" },
                    reason: {
                      type: "string",
                      description: "120〜200文字程度で、その店舗を具体的に紹介する文章（特徴・料金・どんな人におすすめかを盛り込んだ自然な日本語。単なる一言コメントではなく、ひとつの段落として読める内容にする。AIっぽい定型文を避け、人間のライターが書いたような自然な言い回しにする）",
                    },
                  },
                  required: ["rank", "reason"],
                },
              },
              closing_md: {
                type: "string",
                description: `クロージング文（200〜350文字程度。${rankingGyms.length}件を振り返りつつ、無料体験などを使って自分に合うジムを見つけることを勧める内容。Markdown見出しなしの本文のみ。AIっぽい定型文ではなく人間のライターらしい自然な文章にする）`,
              },
            },
            required: ["seo_title", "meta_description", "body_md", "gym_reasons", "closing_md"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_ranking_content" },
      messages: [{ role: "user", content: prompt }],
    });
    const toolUse = message.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!toolUse) throw new Error("ツール呼び出しが見つかりません");
    generated = toolUse.input as Record<string, any>;
  } catch (e: any) {
    return NextResponse.json({ error: `AI生成失敗: ${e.message}` }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("rankings")
    .update({
      seo_title: generated.seo_title ?? null,
      meta_description: generated.meta_description ?? null,
      body_md: generated.body_md ?? null,
      closing_md: generated.closing_md ?? null,
    })
    .eq("id", rankingId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const reasons: { rank: number; reason: string }[] = Array.isArray(generated.gym_reasons) ? generated.gym_reasons : [];
  for (const row of rankingGyms as any[]) {
    const match = reasons.find((r) => r.rank === row.rank);
    if (match?.reason) {
      await admin.from("ranking_gyms").update({ reason: match.reason }).eq("id", row.id);
    }
  }

  return NextResponse.json({ ok: true, rankingId, gymReasonCount: reasons.length });
}

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
  const featureId: string = body.featureId ?? "";
  const title: string = (body.title ?? "").trim();
  const category: string = (body.category ?? "").trim();
  const prefectureName: string = (body.prefectureName ?? "").trim();
  const cityName: string = (body.cityName ?? "").trim();
  const stationName: string = (body.stationName ?? "").trim();

  if (!title && !category) {
    return NextResponse.json({ error: "タイトルかカテゴリのどちらかを入力してから生成してください" }, { status: 400 });
  }

  const areaName = stationName || cityName || prefectureName || "東海エリア";

  let gymListText = "";
  if (featureId) {
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("feature_gyms")
      .select("comment, gyms(name, area_name, monthly_fee_min, has_trial, is_female_friendly, has_private_room, has_nutrition_support, supports_contest)")
      .eq("feature_id", featureId)
      .order("sort_order");
    if (rows && rows.length > 0) {
      gymListText = rows
        .map((row: any) => {
          const g = row.gyms;
          const features = [
            g?.is_female_friendly && "女性専用",
            g?.has_private_room && "完全個室",
            g?.has_nutrition_support && "食事指導あり",
            g?.supports_contest && "コンテスト対応",
            g?.has_trial && "無料体験あり",
          ].filter(Boolean).join("・");
          return `・${g?.name}（月額${g?.monthly_fee_min ? `${g.monthly_fee_min}円〜` : "不明"}${features ? `、${features}` : ""}）`;
        })
        .join("\n");
    }
  }

  const prompt = `あなたはパーソナルジム紹介メディア「FitBase」のライターです。
以下の情報をもとに、特集記事のコンテンツをJSON形式で出力してください。

【特集タイトル（仮）】${title || "（未設定。内容に合うタイトルを考えて提案してください）"}
【カテゴリ】${category || "未設定"}
【対象エリア】${areaName}
${gymListText ? `【この特集に掲載されているジム】\n${gymListText}\n` : ""}

特集記事は単純なリストではなく、読者の悩みや知りたいことに寄り添う「読み物」として、複数の見出し(##)で構成された読みやすい記事にしてください。
構成の目安: 導入（なぜこの特集を読むべきか）→ 本題のセクションを2〜4個（##見出し、必要に応じて###小見出しや箇条書きを使う）→ まとめ。
${gymListText ? "掲載ジムへの言及は具体的な店舗名を使って構いませんが、料金や評価の細かい計算方法には触れないでください。" : "具体的な店舗名は出さず、選び方のポイントや一般的な観点を中心に書いてください。"}
誇大表現や断定的な医療・効果効能の主張は避けてください。

文章はAIが書いたような硬さ・テンプレート感を避け、人間のライターが書いたような自然な文章にしてください。
具体的には: 「〜でしょう」「〜と言えるでしょう」「ぜひ参考にしてみてください」のような定型的なAI口調を多用しない、一文の長さに変化をつける、体言止めや短い文を交えて単調にならないようにする、不要な前置きや言い換えの繰り返しを避ける、といったことを意識してください。
「！」も適度に使って感情のこもった自然な文章にしてください。ただし多用しすぎると軽い印象になるので、1段落につき1箇所程度を目安にしてください。

本文は1500〜2500文字程度を目安にしてください。見出しはMarkdownの##・###のみを使い、本文先頭にh1相当の見出し（記事タイトルの再掲）は不要です。`;

  let generated: Record<string, any>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [
        {
          name: "submit_feature_content",
          description: "特集記事のコンテンツを送信する",
          input_schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "特集タイトル（既に指定がある場合はそれを尊重し、未設定の場合のみ提案する。30文字程度）" },
              category: { type: "string", description: "カテゴリ（例: 女性向け特集、初心者向け特集。既に指定がある場合はそれを尊重）" },
              seo_title: { type: "string", description: "SEOタイトル（30〜50文字）" },
              meta_description: { type: "string", description: "メタディスクリプション（80〜120文字）" },
              body_md: { type: "string", description: "特集記事本文（Markdown形式、##・###見出しを使った1500〜2500文字程度のリッチな記事）" },
              faq: {
                type: "array",
                description: "この特集のテーマに関するよくある質問（3〜5件）",
                items: {
                  type: "object",
                  properties: {
                    q: { type: "string", description: "質問（30文字程度）" },
                    a: { type: "string", description: "回答（80〜150文字程度）" },
                  },
                  required: ["q", "a"],
                },
              },
            },
            required: ["title", "category", "seo_title", "meta_description", "body_md", "faq"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_feature_content" },
      messages: [{ role: "user", content: prompt }],
    });
    const toolUse = message.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!toolUse) throw new Error("ツール呼び出しが見つかりません");
    generated = toolUse.input as Record<string, any>;
  } catch (e: any) {
    return NextResponse.json({ error: `AI生成失敗: ${e.message}` }, { status: 500 });
  }

  return NextResponse.json({
    title: title || generated.title,
    category: category || generated.category,
    seo_title: generated.seo_title,
    meta_description: generated.meta_description,
    body_md: generated.body_md,
    faq: Array.isArray(generated.faq) ? generated.faq : [],
  });
}

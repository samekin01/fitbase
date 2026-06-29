import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripMarkdownToPlainText } from "@/lib/markdown";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SEO_TITLE_MAX = 60;
const META_DESCRIPTION_MAX = 120;

type TableName = "gyms" | "articles" | "features" | "rankings" | "prefectures" | "cities";
const VALID_TABLES: TableName[] = ["gyms", "articles", "features", "rankings", "prefectures", "cities"];

const SEO_KNOWHOW = `あなたはFitBase（東海エリア特化のパーソナルジム検索メディア）のSEO担当者です。
以下のSEOノウハウに従って、このページのSEOタイトルとメタディスクリプションを作成してください。

【SEOタイトルのルール】
- 全角で28〜32文字程度を目安にする（Google検索結果やスマホ表示で末尾が切れるのを防ぐため）。60文字を超えてはならない。
- 最も重要なキーワード（エリア名・カテゴリ・店舗名など）を前方に配置する。
- サイト名「FitBase」は表示時に自動で付与されるため、タイトル自体には含めない。
- 「口コミ・料金」「おすすめ○選」「比較」のような、検索ユーザーがクリックしたくなる具体的な訴求語を含める。
- 他の似たページと同じ文言にならないよう、固有名詞（店舗名・エリア名）を必ず含めて差別化する。

【メタディスクリプションのルール】
- 80〜120文字程度（スマホでは前半50〜70文字程度しか表示されないため、要点は文頭に置く）。120文字を超えてはならない。
- 検索意図に応える要約文にし、末尾に行動を促す一文を入れる（例:「料金や口コミを比較できます」「無料体験の有無もチェック」）。
- 誇大表現や断定的な効果効能の主張（「必ず痩せる」等）は避ける。
- ページの実際の内容と一致させ、内容にないことは書かない。`;

function buildToolSchema() {
  return {
    name: "submit_seo_fields",
    description: "SEOタイトルとメタディスクリプションを送信する",
    input_schema: {
      type: "object" as const,
      properties: {
        seo_title: { type: "string", description: `SEOタイトル（28〜32文字程度、${SEO_TITLE_MAX}文字以内）` },
        meta_description: { type: "string", description: `メタディスクリプション（80〜120文字程度、${META_DESCRIPTION_MAX}文字以内）` },
      },
      required: ["seo_title", "meta_description"],
    },
  };
}

async function generate(prompt: string): Promise<{ seo_title: string; meta_description: string }> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    tools: [buildToolSchema()],
    tool_choice: { type: "tool", name: "submit_seo_fields" },
    messages: [{ role: "user", content: `${SEO_KNOWHOW}\n\n${prompt}` }],
  });
  const toolUse = message.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
  if (!toolUse) throw new Error("ツール呼び出しが見つかりません");
  const generated = toolUse.input as { seo_title?: string; meta_description?: string };
  return {
    seo_title: (generated.seo_title ?? "").slice(0, SEO_TITLE_MAX),
    meta_description: (generated.meta_description ?? "").slice(0, META_DESCRIPTION_MAX),
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY が未設定です" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const table: TableName = body.table;
  const id: string = body.id ?? "";
  if (!VALID_TABLES.includes(table) || !id) {
    return NextResponse.json({ error: "table / id は必須です" }, { status: 400 });
  }

  const admin = createAdminClient();
  let prompt: string;

  if (table === "gyms") {
    const { data: row } = await admin
      .from("gyms")
      .select("name, area_name, description, monthly_fee_min, has_trial, is_female_friendly, has_private_room")
      .eq("id", id)
      .single();
    if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    const features = [
      row.is_female_friendly && "女性専用",
      row.has_private_room && "完全個室",
      row.has_trial && "無料体験あり",
    ].filter(Boolean).join("・");
    prompt = `【ページの種類】パーソナルジムの詳細ページ
【店舗名】${row.name}
【エリア】${row.area_name ?? "不明"}
【月額料金】${row.monthly_fee_min ? `${row.monthly_fee_min}円〜` : "不明"}
【特徴】${features || "なし"}
【店舗説明】${stripMarkdownToPlainText(row.description).slice(0, 400) || "なし"}`;
  } else if (table === "articles") {
    const { data: row } = await admin.from("articles").select("title, category, body_md").eq("id", id).single();
    if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    prompt = `【ページの種類】お役立ち記事
【タイトル】${row.title}
【カテゴリ】${row.category ?? "なし"}
【本文（一部）】${stripMarkdownToPlainText(row.body_md).slice(0, 500)}`;
  } else if (table === "features") {
    const { data: row } = await admin
      .from("features")
      .select("title, category, body_md, prefectures(name), cities(name)")
      .eq("id", id)
      .single();
    if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    const areaName = (row.cities as any)?.name ?? (row.prefectures as any)?.name ?? "";
    prompt = `【ページの種類】特集記事
【タイトル】${row.title}
【エリア】${areaName || "なし"}
【カテゴリ】${row.category ?? "なし"}
【本文（一部）】${stripMarkdownToPlainText(row.body_md as any).slice(0, 500)}`;
  } else if (table === "rankings") {
    const { data: row } = await admin
      .from("rankings")
      .select("title, category, body_md, prefectures(name), cities(name)")
      .eq("id", id)
      .single();
    if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    const areaName = (row.cities as any)?.name ?? (row.prefectures as any)?.name ?? "";
    prompt = `【ページの種類】パーソナルジムのおすすめランキング記事
【タイトル】${row.title}
【エリア】${areaName || "なし"}
【カテゴリ】${row.category ?? "なし"}
【導入文（一部）】${stripMarkdownToPlainText(row.body_md).slice(0, 400)}`;
  } else if (table === "prefectures") {
    const { data: row } = await admin.from("prefectures").select("name, intro_text").eq("id", id).single();
    if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    prompt = `【ページの種類】都道府県別のパーソナルジム一覧ページ
【都道府県名】${row.name}
【紹介文（一部）】${stripMarkdownToPlainText(row.intro_text).slice(0, 300)}`;
  } else {
    const { data: row } = await admin.from("cities").select("name, intro_text, prefectures(name)").eq("id", id).single();
    if (!row) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    const prefName = (row.prefectures as any)?.name ?? "";
    prompt = `【ページの種類】市区町村別のパーソナルジム一覧ページ
【市区町村名】${row.name}
【都道府県】${prefName}
【紹介文（一部）】${stripMarkdownToPlainText(row.intro_text).slice(0, 300)}`;
  }

  let generated: { seo_title: string; meta_description: string };
  try {
    generated = await generate(prompt);
  } catch (e: any) {
    return NextResponse.json({ error: `AI生成失敗: ${e.message}` }, { status: 500 });
  }

  // この時点ではDBには保存しない。管理者が内容を確認し、別エンドポイント(seo-ai-apply)で
  // 明示的に「適用」した時だけ保存する。
  return NextResponse.json({ ok: true, ...generated });
}

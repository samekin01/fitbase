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
  const prefectureId: string = (body.prefectureId ?? "").trim();
  const cityId: string = (body.cityId ?? "").trim();
  const stationId: string = (body.stationId ?? "").trim();
  const prefectureName: string = (body.prefectureName ?? "").trim();
  const cityName: string = (body.cityName ?? "").trim();
  const stationName: string = (body.stationName ?? "").trim();

  if (!title && !category) {
    return NextResponse.json({ error: "タイトルかカテゴリのどちらかを入力してから生成してください" }, { status: 400 });
  }

  const areaName = stationName || cityName || prefectureName || "東海エリア";
  const admin = createAdminClient();

  let gymListText = "";
  if (featureId) {
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

  // 「○選」のような特集記事用に、実在する公開ジムの中から実際に掲載するジムをAIに選ばせる。
  // 編集画面の保存時にfeature_gymsへ反映され、公開ページではカード形式（クリックでジム詳細へ）で表示される。
  // area_nameは未入力運用のため使わず、prefecture_id/city_id/nearest_station_idで絞り込む（駅 > 市区町村 > 都道府県の優先順）。
  let candidatesQuery = admin
    .from("gyms")
    .select("id, name, address, monthly_fee_min, has_trial, is_female_friendly, has_private_room, has_nutrition_support, supports_contest, is_near_station, google_rating, google_review_count")
    .eq("status", "published")
    .limit(50);
  if (stationId) candidatesQuery = candidatesQuery.eq("nearest_station_id", stationId);
  else if (cityId) candidatesQuery = candidatesQuery.eq("city_id", cityId);
  else if (prefectureId) candidatesQuery = candidatesQuery.eq("prefecture_id", prefectureId);
  const { data: candidates } = await candidatesQuery;

  const candidateList = candidates ?? [];
  const candidateText = candidateList
    .map((g: any) => {
      const features = [
        g.is_near_station && "駅近",
        g.is_female_friendly && "女性専用",
        g.has_private_room && "完全個室",
        g.has_nutrition_support && "食事指導あり",
        g.supports_contest && "コンテスト対応",
        g.has_trial && "無料体験あり",
      ].filter(Boolean).join("・");
      return `id:${g.id} ${g.name}（${g.address ?? "エリア不明"}、月額${g.monthly_fee_min ? `${g.monthly_fee_min}円〜` : "不明"}、評価${g.google_rating ?? "不明"}(${g.google_review_count ?? 0}件)${features ? `、${features}` : ""}）`;
    })
    .join("\n");

  const prompt = `あなたはパーソナルジム紹介メディア「FitBase」のライターです。
以下の情報をもとに、特集記事のコンテンツをJSON形式で出力してください。

【特集タイトル（仮）】${title || "（未設定。内容に合うタイトルを考えて提案してください）"}
【カテゴリ】${category || "未設定"}
【対象エリア】${areaName}
${gymListText ? `【この特集に既に掲載されているジム】\n${gymListText}\n` : ""}

【掲載候補となる実在のジム一覧（idを使って選んでください。ここに無いジムは存在しないものとして扱い、絶対に創作しないこと）】
${candidateText || "（該当エリアに公開中のジムが見つかりませんでした）"}

タイトルが「○選」「おすすめ○件」のような選定記事の場合や、掲載候補ジムが3件以上ある場合は、gym_sectionsで実在のジムを具体的に選び、エリア（候補ジムの住所から実際の最寄り駅・地区名を判断）ごとにグループ分けしてください（タイトルに数字があればその件数、無ければ3〜8件程度。候補が少ない場合は無理に増やさない）。
gym_sectionsの各ジムのheadlineは、必ず「{料金・個室・女性専用・無料体験などの実際の特徴に基づいた選び方の切り口}なら{ジム名}」という形式で、ジム名を省略せず必ず含めてください（例:「安さで選ぶなら○○ジム」「完全個室というプライバシー重視なら○○ジム」）。同じ切り口を別のジムで繰り返さず、できるだけ多様な切り口にしてください。
body_md（記事冒頭の導入文のみ。300〜500文字程度）以外の「読み物」としての文章は書かないでください。エリアごとの見出しや各ジムの紹介文はgym_sectionsの中に構造化して出力するため、body_md内でエリア見出し(##)や個々のジム紹介を重複して書かないでください。
掲載候補ジムが無い、または記事のテーマ上ジムを列挙する必要がない場合は、gym_sectionsは空配列にして、body_mdに選び方のポイントや一般的な観点を中心とした読み物を300〜800文字程度で書いてください。
誇大表現や断定的な医療・効果効能の主張は避けてください。

【FAQ作成について（SEO・LLMO対策）】
faqは、検索エンジンやChatGPT・Perplexityなどの対話型AIに引用されることを意識して作成してください。
- 質問文は「ジムの選び方は？」のような当たり障りのない一般論ではなく、この特集が実際に対象にしているエリア・タイトルのテーマ・選んだジムの特徴（料金帯・個室の有無・女性専用かどうかなど、gym_sectionsの内容）に即した、検索される実際のクエリに近い具体的な質問にしてください（例:「${areaName}のパーソナルジムの料金相場はどれくらい？」「${areaName}で完全個室のパーソナルジムはある？」）。
- 回答は、その1問1答だけを読んでも内容が完全に伝わる自己完結した文章にしてください（「詳しくは本文をご覧ください」のような誘導や、前後の文脈に依存する書き方は避ける）。具体的な事実（エリア名・件数・料金帯など、上記の情報に基づく正確な内容）を含め、抽象的な一般論で終わらせないこと。
- gym_sectionsを選んだ場合は、そのうち最低1件はgym_sections内の具体的なジム名や料金帯に触れたFAQにしてください。
- 4〜6件、それぞれ重複しないテーマにしてください。

文章はAIが書いたような硬さ・テンプレート感を避け、人間のライターが書いたような自然な文章にしてください。
具体的には: 「〜でしょう」「〜と言えるでしょう」「ぜひ参考にしてみてください」のような定型的なAI口調を多用しない、一文の長さに変化をつける、体言止めや短い文を交えて単調にならないようにする、不要な前置きや言い換えの繰り返しを避ける、といったことを意識してください。
「！」も適度に使って感情のこもった自然な文章にしてください。ただし多用しすぎると軽い印象になるので、1段落につき1箇所程度を目安にしてください。

本文先頭にh1相当の見出し（記事タイトルの再掲）は不要です。`;

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
              body_md: { type: "string", description: "記事冒頭の導入文のみ（Markdown形式、見出しなし、300〜500文字程度。gym_sectionsが空の場合は300〜800文字の読み物全体）" },
              gym_sections: {
                type: "array",
                description: "エリアごとにグループ化した掲載ジム（候補一覧のidからのみ選ぶこと。無関係な場合は空配列）",
                items: {
                  type: "object",
                  properties: {
                    area_label: { type: "string", description: "エリア見出し（h2相当。例:「名古屋駅周辺：仕事帰りのゴールデンエリア」。15〜25文字程度）" },
                    gyms: {
                      type: "array",
                      description: "このエリア内のジム（候補一覧のidからのみ選ぶこと）",
                      items: {
                        type: "object",
                        properties: {
                          gym_id: { type: "string", description: "候補一覧に記載されているid" },
                          headline: { type: "string", description: "「{選び方の切り口}なら{ジム名}」の形式の見出し（h3相当、ジム名を必ず含める。例:「安さで選ぶなら○○ジム」。20〜30文字程度）" },
                          text: { type: "string", description: "このジムをこの切り口で推す理由（80〜150文字程度。料金や評価の細かい計算方法には触れない）" },
                        },
                        required: ["gym_id", "headline", "text"],
                      },
                    },
                  },
                  required: ["area_label", "gyms"],
                },
              },
              faq: {
                type: "array",
                description: "この特集の対象エリア・テーマ・gym_sectionsの内容に即した、SEO・LLMO対策を意識したよくある質問（4〜6件、重複テーマなし）",
                items: {
                  type: "object",
                  properties: {
                    q: { type: "string", description: "実際の検索クエリに近い具体的な質問（このエリア名やテーマを含める。30〜40文字程度）" },
                    a: { type: "string", description: "その1問1答だけで完結する具体的な回答（事実に基づく内容、80〜150文字程度）" },
                  },
                  required: ["q", "a"],
                },
              },
            },
            required: ["title", "category", "seo_title", "meta_description", "body_md", "gym_sections", "faq"],
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

  // AIが候補一覧に無いidを返した場合（ハルシネーション）はそのジムを捨てる。結果的に空になったセクションも除外する。
  const candidateMap = new Map(candidateList.map((g: any) => [g.id, g]));
  const rawSections: { area_label?: string; gyms?: { gym_id?: string; headline?: string; text?: string }[] }[] =
    Array.isArray(generated.gym_sections) ? generated.gym_sections : [];
  const gymSections = rawSections
    .map((section) => ({
      area_label: section.area_label ?? "",
      gyms: (Array.isArray(section.gyms) ? section.gyms : [])
        .filter((g) => g.gym_id && candidateMap.has(g.gym_id))
        .map((g) => {
          const name = candidateMap.get(g.gym_id!)!.name;
          const headline = g.headline ?? "";
          // AIがheadlineにジム名を含め忘れた場合のフォールバック
          return {
            gym_id: g.gym_id as string,
            name,
            headline: headline && headline.includes(name) ? headline : `${headline ? `${headline} ` : ""}${name}`,
            text: g.text ?? "",
          };
        }),
    }))
    .filter((section) => section.area_label && section.gyms.length > 0);

  return NextResponse.json({
    title: title || generated.title,
    category: category || generated.category,
    seo_title: generated.seo_title,
    meta_description: generated.meta_description,
    body_md: generated.body_md,
    gym_sections: gymSections,
    faq: Array.isArray(generated.faq) ? generated.faq : [],
  });
}

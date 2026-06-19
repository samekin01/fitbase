import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AVAILABLE_TAGS = [
  { slug: "open-24h",          name: "24時間営業" },
  { slug: "online",            name: "オンライン指導あり" },
  { slug: "diet",              name: "ダイエット特化" },
  { slug: "body-make",         name: "ボディメイク" },
  { slug: "rehabilitation",    name: "リハビリ" },
  { slug: "beginner",          name: "初心者歓迎" },
  { slug: "female-only",       name: "女性専門" },
  { slug: "student",           name: "学生向け" },
  { slug: "private-room",      name: "完全個室" },
  { slug: "postnatal",         name: "産後ケア" },
  { slug: "male-only",         name: "男性専門" },
  { slug: "parking",           name: "駐車場あり" },
  { slug: "senior",            name: "高齢者対応" },
];

// .slice() による切り詰めが絵文字等のサロゲートペアの間で発生すると、
// 不完全な（対になっていない）サロゲートが残りJSON送信時にAPIエラーになるため除去する
function stripLoneSurrogates(s: string): string {
  return s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "").replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FitBase-Bot/1.0)" },
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
    return stripLoneSurrogates(text);
  } catch {
    return "";
  }
}

async function fetchAndUploadGooglePhoto(
  placeId: string,
  gymId: string,
  gymName: string,
  admin: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !placeId) return false;

  try {
    // Get photo references from Places API
    const placeRes = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "photos",
        },
        cache: "no-store",
      }
    );
    if (!placeRes.ok) return false;

    const placeData = await placeRes.json();
    const photoName: string | undefined = placeData.photos?.[0]?.name;
    if (!photoName) return false;

    // Download the photo (server-side — API key never exposed to client)
    const photoRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=1200`,
      { redirect: "follow" }
    );
    if (!photoRes.ok) return false;

    const contentType = photoRes.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const buffer = Buffer.from(await photoRes.arrayBuffer());
    if (buffer.length === 0) return false;

    const storagePath = `${gymId}/google-cover.${ext}`;

    // Upload to Supabase Storage (upsert to overwrite if re-running)
    const { error: storageError } = await admin.storage
      .from("gym-images")
      .upload(storagePath, buffer, { contentType, upsert: true });
    if (storageError) return false;

    const { data: publicUrl } = admin.storage.from("gym-images").getPublicUrl(storagePath);

    // Check if a cover image already exists for this gym
    const { data: existing } = await admin
      .from("gym_images")
      .select("id")
      .eq("gym_id", gymId)
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (existing) {
      // Update the existing record's URL (in case it changed)
      await admin
        .from("gym_images")
        .update({ image_url: publicUrl.publicUrl })
        .eq("id", existing.id);
    } else {
      // Mark any existing images as non-cover, then insert this as cover
      await admin.from("gym_images").update({ is_cover: false }).eq("gym_id", gymId);
      await admin.from("gym_images").insert({
        gym_id: gymId,
        storage_path: storagePath,
        image_url: publicUrl.publicUrl,
        alt_text: gymName,
        is_cover: true,
        sort_order: 0,
      });
    }

    return true;
  } catch {
    return false;
  }
}

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

  // Fetch gym basic info
  const { data: gym, error: gymError } = await admin
    .from("gyms")
    .select("id, name, address, google_rating, google_review_count, website_url, phone, google_place_id")
    .eq("id", gymId)
    .single();

  if (gymError || !gym) {
    return NextResponse.json({ error: "ジムが見つかりません" }, { status: 404 });
  }

  // Fetch all tags from DB to get correct IDs
  const { data: dbTags } = await admin.from("tags").select("id, slug, name");
  const tagMap = new Map((dbTags ?? []).map((t: any) => [t.slug, t.id]));

  // Scrape website and fetch Google photo in parallel
  const [websiteText, photoOk] = await Promise.all([
    gym.website_url ? scrapeWebsite(gym.website_url) : Promise.resolve(""),
    fetchAndUploadGooglePhoto(gym.google_place_id ?? "", gymId, gym.name, admin),
  ]);

  const tagList = AVAILABLE_TAGS.map((t) => `${t.slug}（${t.name}）`).join(", ");

  const prompt = `あなたはパーソナルジム紹介メディア「FitBase」のライターです。
以下のジム情報をもとに、FitBaseの各フィールドをJSON形式で出力してください。
情報が不明な場合はnullにしてください。金額は半角数字のみ（カンマ・円マーク不要）。

【ジム基本情報】
名前: ${gym.name}
住所: ${gym.address ?? "不明"}
Googleレビュー: ${gym.google_rating ?? "不明"}（${gym.google_review_count ?? 0}件）
公式サイト: ${gym.website_url ?? "なし"}
電話: ${gym.phone ?? "不明"}

【公式サイト内容】
${websiteText || "（取得できませんでした）"}

【利用可能なタグスラッグ一覧】
${tagList}

以下のJSONを出力してください（他の文字は一切出力しないこと）:
{
  "description": "店舗説明（150〜300文字の自然な日本語）",
  "recommended_points": "おすすめポイント（箇条書き可、100〜200文字）",
  "target_users": "対象ユーザー（50〜100文字）",
  "trainer_info": "トレーナー情報（不明ならnull）",
  "facilities": "設備・アクセス情報（不明ならnull）",
  "seo_title": "SEOタイトル（30〜50文字、「${gym.name}の口コミ・料金」のような形式）",
  "meta_description": "メタディスクリプション（80〜120文字）",
  "admission_fee": null,
  "monthly_fee_min": null,
  "total_price_min": null,
  "has_trial": false,
  "trial_fee": null,
  "is_female_friendly": false,
  "has_private_room": false,
  "has_nutrition_support": false,
  "supports_contest": false,
  "is_near_station": false,
  "tag_slugs": []
}`;

  let generated: Record<string, any>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = (message.content[0] as any).text ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSONが見つかりません");

    const repaired = jsonMatch[0].replace(
      /"(?:[^"\\]|\\.)*"/g,
      (m) => m.replace(/\n/g, "\\n").replace(/\r/g, "").replace(/\t/g, "\\t")
    );
    generated = JSON.parse(repaired);
  } catch (e: any) {
    return NextResponse.json({ error: `AI生成失敗: ${e.message}` }, { status: 500 });
  }

  // Resolve tag IDs
  const tagSlugs: string[] = Array.isArray(generated.tag_slugs) ? generated.tag_slugs : [];
  const tagIds = tagSlugs.map((s) => tagMap.get(s)).filter(Boolean) as string[];

  // Update gym fields
  const { error: updateError } = await admin
    .from("gyms")
    .update({
      description: generated.description ?? null,
      recommended_points: generated.recommended_points ?? null,
      target_users: generated.target_users ?? null,
      trainer_info: generated.trainer_info ?? null,
      facilities: generated.facilities ?? null,
      seo_title: generated.seo_title ?? null,
      meta_description: generated.meta_description ?? null,
      admission_fee: generated.admission_fee ?? null,
      monthly_fee_min: generated.monthly_fee_min ?? null,
      total_price_min: generated.total_price_min ?? null,
      has_trial: generated.has_trial ?? false,
      trial_fee: generated.trial_fee ?? null,
      is_female_friendly: generated.is_female_friendly ?? false,
      has_private_room: generated.has_private_room ?? false,
      has_nutrition_support: generated.has_nutrition_support ?? false,
      supports_contest: generated.supports_contest ?? false,
      is_near_station: generated.is_near_station ?? false,
    })
    .eq("id", gymId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Update tags: delete existing then insert
  if (tagIds.length > 0) {
    await admin.from("gym_tags").delete().eq("gym_id", gymId);
    await admin.from("gym_tags").insert(tagIds.map((tag_id) => ({ gym_id: gymId, tag_id })));
  }

  return NextResponse.json({ ok: true, gymId, tagCount: tagIds.length, photoOk });
}

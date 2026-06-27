import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY が未設定です" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const featureId: string = body.featureId ?? "";
  if (!featureId) return NextResponse.json({ error: "featureId は必須です" }, { status: 400 });

  const admin = createAdminClient();

  const { data: feature } = await admin
    .from("features")
    .select("id, title, category, prefectures(name), cities(name)")
    .eq("id", featureId)
    .single();
  if (!feature) return NextResponse.json({ error: "特集が見つかりません" }, { status: 404 });

  const areaName = (feature.cities as any)?.name ?? (feature.prefectures as any)?.name ?? "東海エリア";
  const prompt = `${areaName}のパーソナルトレーニングジムを紹介する特集記事「${feature.title}」のブログ記事サムネイル。明るく清潔感のあるジムの室内、トレーニング器具やダンベルが見える写実的な写真風イラスト。文字やロゴ、人の顔のクローズアップは入れない。横長で落ち着いた配色。`;

  try {
    const genRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "16:9" },
        }),
      }
    );
    if (!genRes.ok) {
      const errText = await genRes.text();
      return NextResponse.json({ error: `画像生成APIエラー: ${errText.slice(0, 300)}` }, { status: 500 });
    }
    const genData = await genRes.json();
    const base64: string | undefined = genData.predictions?.[0]?.bytesBase64Encoded;
    if (!base64) return NextResponse.json({ error: "画像データが返されませんでした" }, { status: 500 });

    const buffer = Buffer.from(base64, "base64");
    const storagePath = `features/${featureId}-${Date.now()}.png`;

    const { error: storageError } = await admin.storage
      .from("gym-images")
      .upload(storagePath, buffer, { contentType: "image/png", upsert: true });
    if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });

    const { data: publicUrl } = admin.storage.from("gym-images").getPublicUrl(storagePath);

    const { error: updateError } = await admin
      .from("features")
      .update({ eyecatch_image_url: publicUrl.publicUrl } as any)
      .eq("id", featureId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ ok: true, url: publicUrl.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

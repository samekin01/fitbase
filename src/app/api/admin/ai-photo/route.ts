import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const gymId: string = body.gymId ?? "";
  if (!gymId) return NextResponse.json({ error: "gymId は必須です" }, { status: 400 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY が未設定です" }, { status: 503 });

  const admin = createAdminClient();

  const { data: gym } = await admin
    .from("gyms")
    .select("id, name, google_place_id")
    .eq("id", gymId)
    .single();

  if (!gym?.google_place_id) {
    return NextResponse.json({ error: "google_place_id がありません" }, { status: 400 });
  }

  try {
    // Get photo reference
    const placeRes = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(gym.google_place_id)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "photos",
        },
        cache: "no-store",
      }
    );
    if (!placeRes.ok) return NextResponse.json({ error: "Places API エラー" }, { status: 500 });

    const placeData = await placeRes.json();
    const photoName: string | undefined = placeData.photos?.[0]?.name;
    if (!photoName) return NextResponse.json({ error: "写真が見つかりません" }, { status: 404 });

    // Download photo
    const photoRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=1200`,
      { redirect: "follow" }
    );
    if (!photoRes.ok) return NextResponse.json({ error: "写真ダウンロード失敗" }, { status: 500 });

    const contentType = photoRes.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const buffer = Buffer.from(await photoRes.arrayBuffer());
    if (buffer.length === 0) return NextResponse.json({ error: "写真データが空です" }, { status: 500 });

    const storagePath = `${gymId}/google-cover.${ext}`;

    const { error: storageError } = await admin.storage
      .from("gym-images")
      .upload(storagePath, buffer, { contentType, upsert: true });
    if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });

    const { data: publicUrl } = admin.storage.from("gym-images").getPublicUrl(storagePath);

    // Upsert gym_images record
    const { data: existing } = await admin
      .from("gym_images")
      .select("id")
      .eq("gym_id", gymId)
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (existing) {
      await admin.from("gym_images").update({ image_url: publicUrl.publicUrl }).eq("id", existing.id);
    } else {
      await admin.from("gym_images").update({ is_cover: false }).eq("gym_id", gymId);
      await admin.from("gym_images").insert({
        gym_id: gymId,
        storage_path: storagePath,
        image_url: publicUrl.publicUrl,
        alt_text: gym.name,
        is_cover: true,
        sort_order: 0,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rankingId: string = body.rankingId ?? "";
  const dataUrl: string = body.dataUrl ?? "";
  if (!rankingId || !dataUrl) {
    return NextResponse.json({ error: "rankingId と dataUrl は必須です" }, { status: 400 });
  }

  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) return NextResponse.json({ error: "不正な画像データです" }, { status: 400 });

  const admin = createAdminClient();
  const buffer = Buffer.from(match[1], "base64");
  const storagePath = `rankings/${rankingId}-edited-${Date.now()}.png`;

  const { error: storageError } = await admin.storage
    .from("gym-images")
    .upload(storagePath, buffer, { contentType: "image/png", upsert: true });
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });

  const { data: publicUrl } = admin.storage.from("gym-images").getPublicUrl(storagePath);

  const { error: updateError } = await admin
    .from("rankings")
    .update({ eyecatch_image_url: publicUrl.publicUrl })
    .eq("id", rankingId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, url: publicUrl.publicUrl });
}

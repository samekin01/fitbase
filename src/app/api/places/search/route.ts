import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchPlaces } from "@/lib/places/google-places";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const query: string = (body.query ?? "").trim();
  const prefSlug: string = body.prefSlug ?? "";

  if (!query) return NextResponse.json({ error: "query は必須です" }, { status: 400 });

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY が未設定です" }, { status: 503 });
  }

  try {
    const candidates = await searchPlaces(query, prefSlug || undefined);

    // Check which place IDs are already in the DB
    const placeIds = candidates.map((c) => c.placeId).filter(Boolean);
    const admin = createAdminClient();
    const { data: existing } = placeIds.length
      ? await admin.from("gyms").select("google_place_id").in("google_place_id", placeIds)
      : { data: [] };

    const importedSet = new Set((existing ?? []).map((g: any) => g.google_place_id));

    return NextResponse.json({
      results: candidates.map((c) => ({ ...c, alreadyImported: importedSet.has(c.placeId) })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

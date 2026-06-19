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
  const pageToken: string | undefined = body.pageToken || undefined;
  const lat: number | undefined = typeof body.lat === "number" ? body.lat : undefined;
  const lng: number | undefined = typeof body.lng === "number" ? body.lng : undefined;
  const radius: number = typeof body.radius === "number" ? body.radius : 1200;

  if (!query) return NextResponse.json({ error: "query は必須です" }, { status: 400 });

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY が未設定です" }, { status: 503 });
  }

  try {
    const customCenter = lat != null && lng != null ? { lat, lng, radius } : undefined;
    const { candidates, nextPageToken } = await searchPlaces(query, prefSlug || undefined, pageToken, customCenter);

    // Check which place IDs are already in the DB
    const placeIds = candidates.map((c) => c.placeId).filter(Boolean);
    const admin = createAdminClient();
    const { data: existing } = placeIds.length
      ? await admin.from("gyms").select("google_place_id").in("google_place_id", placeIds)
      : { data: [] };

    const importedSet = new Set((existing ?? []).map((g: any) => g.google_place_id));

    return NextResponse.json({
      results: candidates.map((c) => ({ ...c, alreadyImported: importedSet.has(c.placeId) })),
      nextPageToken: nextPageToken ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

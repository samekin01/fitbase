import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPlaceDetails } from "@/lib/places/google-places";

// POST /api/places/sync  body: { gymId: string }
// Updates google_rating, google_review_count, latitude, longitude, phone, website_url for an existing gym
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const gymId: string = body.gymId ?? "";

  if (!gymId) return NextResponse.json({ error: "gymId が必要です" }, { status: 400 });

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY が未設定です" }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data: gym } = await admin
    .from("gyms")
    .select("id, name, google_place_id")
    .eq("id", gymId)
    .single();

  if (!gym) return NextResponse.json({ error: "ジムが見つかりません" }, { status: 404 });
  if (!gym.google_place_id) return NextResponse.json({ error: "Google Place ID が未設定です" }, { status: 400 });

  try {
    const place = await fetchPlaceDetails(gym.google_place_id);

    const { error } = await admin.from("gyms").update({
      google_rating: place.rating,
      google_review_count: place.ratingCount,
      latitude: place.lat || null,
      longitude: place.lng || null,
      phone: place.phone ?? undefined,
      website_url: place.websiteUri ?? undefined,
      google_maps_url: place.mapsUri ?? undefined,
      last_checked_at: new Date().toISOString(),
    }).eq("id", gymId);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      updated: {
        rating: place.rating,
        ratingCount: place.ratingCount,
        lat: place.lat,
        lng: place.lng,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

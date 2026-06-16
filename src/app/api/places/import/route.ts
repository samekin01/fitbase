import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlaceCandidate } from "@/lib/places/google-places";

function placeSlug(name: string, placeId: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = placeId.slice(-10).toLowerCase().replace(/[^a-z0-9]/g, "");
  return ascii ? `${ascii}-${suffix}` : `gp-${suffix}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const candidates: PlaceCandidate[] = body.candidates ?? [];
  const prefectureId: string = body.prefectureId ?? "";

  if (!candidates.length) return NextResponse.json({ error: "candidates が必要です" }, { status: 400 });
  if (!prefectureId) return NextResponse.json({ error: "prefectureId が必要です" }, { status: 400 });

  const admin = createAdminClient();

  // Fetch cities for this prefecture to resolve city_id
  const { data: cities } = await admin
    .from("cities")
    .select("id, name")
    .eq("prefecture_id", prefectureId);

  function resolveCityId(address: string): string | null {
    if (!cities?.length) return null;
    const match = cities.find((c: any) => address.includes(c.name));
    return match?.id ?? null;
  }

  const inserted: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const c of candidates) {
    if (!c.placeId) continue;

    // Skip if already exists
    const { data: existing } = await admin
      .from("gyms")
      .select("id")
      .eq("google_place_id", c.placeId)
      .maybeSingle();

    if (existing) {
      skipped.push(c.name);
      continue;
    }

    const slug = placeSlug(c.name, c.placeId);
    const cityId = resolveCityId(c.address);

    const { error } = await admin.from("gyms").insert({
      name: c.name,
      slug,
      address: c.address,
      latitude: c.lat || null,
      longitude: c.lng || null,
      phone: c.phone,
      website_url: c.websiteUri,
      google_maps_url: c.mapsUri,
      google_place_id: c.placeId,
      google_rating: c.rating,
      google_review_count: c.ratingCount,
      prefecture_id: prefectureId,
      city_id: cityId,
      status: "draft",
      source: "google_places",
    });

    if (error) {
      errors.push(`${c.name}: ${error.message}`);
    } else {
      inserted.push(c.name);
    }
  }

  // Record the job
  await admin.from("google_import_jobs").insert({
    status: errors.length ? "partial" : "completed",
    query: body.query ?? null,
    total_found: candidates.length,
    total_imported: inserted.length,
    completed_at: new Date().toISOString(),
  }).then(() => {});

  return NextResponse.json({ inserted, skipped, errors });
}

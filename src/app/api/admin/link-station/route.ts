import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { haversineMeters, metersToWalkMinutes } from "@/lib/geo";

const PLACES_BASE = "https://places.googleapis.com/v1";

async function getGymLocation(apiKey: string, placeId: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`${PLACES_BASE}/places/${placeId}?fields=location&languageCode=ja`, {
    headers: { "X-Goog-Api-Key": apiKey },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const loc = json.location;
  if (!loc?.latitude || !loc?.longitude) return null;
  return { lat: loc.latitude, lng: loc.longitude };
}

export async function POST(req: NextRequest) {
  try {
    const { gymId } = await req.json();
    if (!gymId) return NextResponse.json({ error: "gymId required" }, { status: 400 });

    const supabase = createAdminClient();
    const { data: gym } = await supabase
      .from("gyms")
      .select("id, name, city_id, latitude, longitude, google_place_id")
      .eq("id", gymId)
      .single();

    if (!gym) return NextResponse.json({ error: "ジムが見つかりません" }, { status: 404 });

    // lat/lngを取得（なければPlaces APIで補完）
    let lat = gym.latitude as number | null;
    let lng = gym.longitude as number | null;

    if ((!lat || !lng) && gym.google_place_id) {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "座標が未設定でGOOGLE_MAPS_API_KEYも未設定です" }, { status: 422 });
      const loc = await getGymLocation(apiKey, gym.google_place_id);
      if (loc) {
        lat = loc.lat;
        lng = loc.lng;
        // lat/lngをDBに保存
        await supabase.from("gyms").update({ latitude: lat, longitude: lng } as any).eq("id", gymId);
      }
    }

    if (!lat || !lng) {
      return NextResponse.json({ error: "座標が取得できません（Google Place IDを確認）" }, { status: 422 });
    }

    // 駅マスタ（自社DB）から最も近い駅を探す
    const allStations = await fetchAllRows((from, to) =>
      supabase
        .from("stations")
        .select("id, name, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .range(from, to)
    );
    if (allStations.length === 0) {
      return NextResponse.json({ error: "駅マスタが空です" }, { status: 422 });
    }

    const nearest = (allStations as any[])
      .map((s) => ({ ...s, distance: haversineMeters(lat!, lng!, s.latitude, s.longitude) }))
      .sort((a, b) => a.distance - b.distance)[0];

    // ジムに最寄駅をセット
    const { error: updateErr } = await supabase
      .from("gyms")
      .update({ nearest_station_id: nearest.id } as any)
      .eq("id", gymId);

    if (updateErr) {
      return NextResponse.json({ error: `紐付け失敗: ${updateErr.message}` }, { status: 500 });
    }

    const walkMinutes = metersToWalkMinutes(nearest.distance);
    return NextResponse.json({
      stationName: nearest.name,
      distanceMeters: Math.round(nearest.distance),
      walkMinutes,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

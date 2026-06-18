import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLACES_BASE = "https://places.googleapis.com/v1";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

async function searchNearbyStations(
  apiKey: string,
  lat: number,
  lng: number
): Promise<{ placeId: string; name: string; lat: number; lng: number }[]> {
  const res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.location",
    },
    body: JSON.stringify({
      includedTypes: ["train_station", "subway_station", "light_rail_station", "transit_station"],
      maxResultCount: 10,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: 2000.0 },
      },
      languageCode: "ja",
    }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.places ?? []).map((p: any) => ({
    placeId: p.id,
    name: p.displayName?.text ?? "不明",
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { gymId } = await req.json();
    if (!gymId) return NextResponse.json({ error: "gymId required" }, { status: 400 });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY未設定" }, { status: 500 });

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

    // 近くの駅を検索
    const stations = await searchNearbyStations(apiKey, lat, lng);
    if (stations.length === 0) {
      return NextResponse.json({ error: "近くに駅が見つかりませんでした" }, { status: 422 });
    }

    // 最も近い駅を選ぶ
    const nearest = stations
      .map((s) => ({ ...s, distance: haversineMeters(lat!, lng!, s.lat, s.lng) }))
      .sort((a, b) => a.distance - b.distance)[0];

    const slug = nearest.placeId.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 60);

    // stations テーブルに upsert
    const { data: existing } = await supabase
      .from("stations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    let stationId: string;
    if (existing) {
      stationId = existing.id;
    } else {
      const { data: created, error: insertErr } = await supabase
        .from("stations")
        .insert({
          name: nearest.name,
          slug,
          city_id: gym.city_id,
          latitude: nearest.lat,
          longitude: nearest.lng,
          sort_order: 99,
        } as any)
        .select("id")
        .single();
      if (insertErr || !created) {
        return NextResponse.json({ error: `駅の保存に失敗: ${insertErr?.message}` }, { status: 500 });
      }
      stationId = created.id;
    }

    // ジムに最寄駅をセット
    const { error: updateErr } = await supabase
      .from("gyms")
      .update({ nearest_station_id: stationId } as any)
      .eq("id", gymId);

    if (updateErr) {
      return NextResponse.json({ error: `紐付け失敗: ${updateErr.message}` }, { status: 500 });
    }

    const walkMinutes = Math.ceil(nearest.distance / 80);
    return NextResponse.json({
      stationName: nearest.name,
      distanceMeters: Math.round(nearest.distance),
      walkMinutes,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

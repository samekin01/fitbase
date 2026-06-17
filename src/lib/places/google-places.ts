const PLACES_BASE = "https://places.googleapis.com/v1";

export type PlaceCandidate = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  ratingCount: number | null;
  phone: string | null;
  websiteUri: string | null;
  mapsUri: string | null;
};

// Prefecture center coordinates for location bias
const PREF_CENTERS: Record<string, { lat: number; lng: number }> = {
  aichi:    { lat: 35.1709, lng: 136.8815 },
  gifu:     { lat: 35.4232, lng: 136.7607 },
  mie:      { lat: 34.7303, lng: 136.5086 },
  shizuoka: { lat: 34.9769, lng: 138.3831 },
};

export async function searchPlaces(
  query: string,
  prefSlug?: string
): Promise<PlaceCandidate[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY が設定されていません");

  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: "ja",
    regionCode: "JP",
    maxResultCount: 20,
  };

  const center = prefSlug ? PREF_CENTERS[prefSlug] : null;
  if (center) {
    body.locationBias = {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: 50000,
      },
    };
  }

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.googleMapsUri",
      ].join(","),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.places ?? []).map((p: any): PlaceCandidate => ({
    placeId: p.id ?? "",
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? "",
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? null,
    phone: p.nationalPhoneNumber ?? null,
    websiteUri: p.websiteUri ?? null,
    mapsUri: p.googleMapsUri ?? null,
  }));
}

export type PlaceDetails = PlaceCandidate & {
  openingHours: unknown;
};

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY が設定されていません");

  const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "location",
        "rating",
        "userRatingCount",
        "nationalPhoneNumber",
        "websiteUri",
        "googleMapsUri",
        "regularOpeningHours",
      ].join(","),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Places Details API ${res.status}`);
  }

  const p = await res.json();
  return {
    placeId: p.id ?? placeId,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? "",
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? null,
    phone: p.nationalPhoneNumber ?? null,
    websiteUri: p.websiteUri ?? null,
    mapsUri: p.googleMapsUri ?? null,
    openingHours: p.regularOpeningHours ?? null,
  };
}

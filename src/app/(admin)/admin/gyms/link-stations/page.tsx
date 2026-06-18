import { createAdminClient } from "@/lib/supabase/admin";
import { StationLinkRunner } from "@/components/admin/StationLinkRunner";

export const dynamic = "force-dynamic";
export const metadata = { title: "最寄駅リンク | FitBase CMS" };

export default async function LinkStationsPage() {
  const supabase = createAdminClient();

  const { data: gyms } = await supabase
    .from("gyms")
    .select(`
      id, name, google_place_id, latitude, longitude, nearest_station_id,
      stations:nearest_station_id(name)
    `)
    .eq("status", "published")
    .order("name");

  const gymRows = (gyms ?? []).map((g: any) => ({
    id: g.id,
    name: g.name,
    google_place_id: g.google_place_id,
    latitude: g.latitude,
    longitude: g.longitude,
    nearest_station_id: g.nearest_station_id,
    stationName: g.stations?.name ?? null,
  }));

  return (
    <div style={{ maxWidth: "960px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-gray-900)" }}>
        最寄駅 自動リンク
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
        Google Places API でジム周辺の駅を自動検索し、最寄駅を設定します（1件あたり約$0.03）。
      </p>
      <StationLinkRunner gyms={gymRows} />
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/paginate";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cityId = req.nextUrl.searchParams.get("cityId") ?? "";
  const prefectureId = req.nextUrl.searchParams.get("prefectureId") ?? "";
  if (!cityId && !prefectureId) {
    return NextResponse.json({ error: "cityId または prefectureId が必要です" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (cityId) {
    const { data: stations } = await admin
      .from("stations")
      .select("id, name, latitude, longitude")
      .eq("city_id", cityId)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("name");
    return NextResponse.json({ stations: stations ?? [] });
  }

  // 都道府県全体: 配下の市区町村IDをすべて取得してから駅を取得
  const { data: cities } = await admin.from("cities").select("id").eq("prefecture_id", prefectureId);
  const cityIds = (cities ?? []).map((c: any) => c.id);
  if (cityIds.length === 0) return NextResponse.json({ stations: [] });

  const stations = await fetchAllRows((from, to) =>
    admin
      .from("stations")
      .select("id, name, latitude, longitude")
      .in("city_id", cityIds)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("name")
      .range(from, to)
  );

  return NextResponse.json({ stations });
}

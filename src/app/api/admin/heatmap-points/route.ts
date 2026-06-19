import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_POINTS = 5000;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = req.nextUrl.searchParams.get("path");
  const days = Number(req.nextUrl.searchParams.get("days") ?? 28);
  if (!path) return NextResponse.json({ error: "path は必須です" }, { status: 400 });

  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await (admin as any)
    .from("page_clicks")
    .select("x_pct, y_pct, doc_height, viewport_width")
    .eq("path", path)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_POINTS);

  return NextResponse.json({ points: data ?? [] });
}

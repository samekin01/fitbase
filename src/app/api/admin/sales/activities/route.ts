import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gymId = req.nextUrl.searchParams.get("gymId");
  if (!gymId) return NextResponse.json({ error: "gymId は必須です" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await (admin as any)
    .from("sales_lead_activities")
    .select("id, activity_date, content, created_at")
    .eq("gym_id", gymId)
    .order("activity_date", { ascending: false })
    .order("created_at", { ascending: false });

  return NextResponse.json({ activities: data ?? [] });
}

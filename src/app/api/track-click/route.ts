import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  const path = typeof body.path === "string" ? body.path.slice(0, 255) : null;
  const xPct = Number(body.xPct);
  const yPct = Number(body.yPct);
  const docHeight = Number(body.docHeight);
  const viewportWidth = Number(body.viewportWidth);

  if (
    !path ||
    path.startsWith("/admin") ||
    !Number.isFinite(xPct) ||
    !Number.isFinite(yPct) ||
    !Number.isFinite(docHeight) ||
    !Number.isFinite(viewportWidth) ||
    xPct < 0 ||
    xPct > 100 ||
    yPct < 0 ||
    yPct > 100
  ) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  await (supabase as any).from("page_clicks").insert({
    path,
    x_pct: xPct,
    y_pct: yPct,
    doc_height: Math.round(docHeight),
    viewport_width: Math.round(viewportWidth),
  });

  return NextResponse.json({ ok: true });
}

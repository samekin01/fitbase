import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { path, tag } = body as { path?: string; tag?: string };

  if (path) {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  }

  if (tag) {
    revalidateTag(tag, {});
    return NextResponse.json({ revalidated: true, tag });
  }

  return NextResponse.json({ error: "path または tag が必要です" }, { status: 400 });
}

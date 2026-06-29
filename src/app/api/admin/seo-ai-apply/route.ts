import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SEO_TITLE_MAX = 60;
const META_DESCRIPTION_MAX = 120;

type TableName = "gyms" | "articles" | "features" | "rankings" | "prefectures" | "cities";
const VALID_TABLES: TableName[] = ["gyms", "articles", "features", "rankings", "prefectures", "cities"];

// AIが生成した内容を、管理者が確認・編集した後に保存するための適用エンドポイント。
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const table: TableName = body.table;
  const id: string = body.id ?? "";
  const seoTitle: string = (body.seo_title ?? "").slice(0, SEO_TITLE_MAX);
  const metaDescription: string = (body.meta_description ?? "").slice(0, META_DESCRIPTION_MAX);

  if (!VALID_TABLES.includes(table) || !id) {
    return NextResponse.json({ error: "table / id は必須です" }, { status: 400 });
  }
  if (!seoTitle || !metaDescription) {
    return NextResponse.json({ error: "seo_title / meta_description は必須です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from(table)
    .update({ seo_title: seoTitle, meta_description: metaDescription })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

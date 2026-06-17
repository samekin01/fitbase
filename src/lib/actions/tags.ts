"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createTag(_prev: { error?: string } | null, formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  if (!name || !slug) return { error: "タグ名とスラッグは必須です。" };

  const supabase = createAdminClient();
  const { error } = await supabase.from("tags").insert({ name, slug, sort_order, category: null });
  if (error) return { error: error.message };

  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function deleteTag(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tags");
}

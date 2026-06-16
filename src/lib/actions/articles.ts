"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentStatus } from "@/types/tables";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

function parseArticleFormData(formData: FormData) {
  return {
    title: (formData.get("title") as string).trim(),
    slug: (formData.get("slug") as string).trim() || slugify(formData.get("title") as string),
    category: (formData.get("category") as string) || null,
    eyecatch_image_url: (formData.get("eyecatch_image_url") as string) || null,
    body_md: (formData.get("body_md") as string) || null,
    supervisor_name: (formData.get("supervisor_name") as string) || null,
    seo_title: (formData.get("seo_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    canonical_url: (formData.get("canonical_url") as string) || null,
    noindex: formData.get("noindex") === "on",
    status: (formData.get("status") as ContentStatus) || "draft",
  };
}

export async function createArticle(formData: FormData) {
  const supabase = createAdminClient();
  const data = parseArticleFormData(formData);
  const isPublished = data.status === "published";

  const { data: article, error } = await supabase
    .from("articles")
    .insert({ ...data, published_at: isPublished ? new Date().toISOString() : null })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/articles");
  redirect(`/admin/articles/${article.id}`);
}

export async function updateArticle(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const data = parseArticleFormData(formData);
  const wasPublished = formData.get("_was_published") === "true";
  const isNowPublished = data.status === "published";

  const updateData: Record<string, unknown> = { ...data };
  if (!wasPublished && isNowPublished) {
    updateData.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("articles").update(updateData).eq("id", id);
  if (error) return { error: error.message };

  const { data: article } = await supabase.from("articles").select("slug").eq("id", id).single();
  if (article?.slug) revalidatePath(`/articles/${article.slug}`);
  revalidatePath("/admin/articles");
  revalidatePath("/articles");
  return { success: true };
}

export async function deleteArticle(id: string) {
  const supabase = createAdminClient();
  const { data: article } = await supabase.from("articles").select("slug").eq("id", id).single();

  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (article?.slug) revalidatePath(`/articles/${article.slug}`);
  revalidatePath("/admin/articles");
  revalidatePath("/articles");
  redirect("/admin/articles");
}

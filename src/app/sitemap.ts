import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";
  const supabase = createAdminClient();

  const [{ data: gyms }, { data: prefs }, { data: cities }, { data: articles }, { data: features }, { data: rankings }] = await Promise.all([
    supabase.from("gyms").select("slug, updated_at").eq("status", "published"),
    supabase.from("prefectures").select("slug, updated_at"),
    supabase.from("cities").select("slug, updated_at, prefectures(slug)"),
    supabase.from("articles").select("slug, updated_at").eq("status", "published"),
    supabase.from("features").select("slug, updated_at").eq("status", "published"),
    supabase.from("rankings").select("slug, updated_at").eq("status", "published"),
  ]);

  const gymEntries: MetadataRoute.Sitemap = (gyms ?? []).map((g: any) => ({
    url: `${siteUrl}/gyms/${g.slug}/`,
    lastModified: g.updated_at ? new Date(g.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const prefEntries: MetadataRoute.Sitemap = (prefs ?? []).map((p: any) => ({
    url: `${siteUrl}/${p.slug}/`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const cityEntries: MetadataRoute.Sitemap = (cities ?? [])
    .filter((c: any) => (c.prefectures as any)?.slug)
    .map((c: any) => ({
      url: `${siteUrl}/${(c.prefectures as any).slug}/${c.slug}/`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((a: any) => ({
    url: `${siteUrl}/articles/${a.slug}/`,
    lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const featureEntries: MetadataRoute.Sitemap = (features ?? []).map((f: any) => ({
    url: `${siteUrl}/features/${f.slug}/`,
    lastModified: f.updated_at ? new Date(f.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const rankingEntries: MetadataRoute.Sitemap = (rankings ?? []).map((r: any) => ({
    url: `${siteUrl}/rankings/${r.slug}/`,
    lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/articles/`, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/features/`, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/rankings/`, changeFrequency: "daily", priority: 0.6 },
    ...prefEntries,
    ...cityEntries,
    ...gymEntries,
    ...articleEntries,
    ...featureEntries,
    ...rankingEntries,
  ];
}

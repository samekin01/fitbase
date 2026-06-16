import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { GymListItem } from "@/components/gym/GymListItem";
import { TocBox } from "@/components/content/TocBox";
import { renderMarkdown } from "@/lib/markdown";
import { toGymSummary } from "@/lib/gym-query";

export const revalidate = 3600;

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("rankings").select("slug").eq("status", "published");
  return (data ?? []).map((r: any) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: ranking } = await supabase
    .from("rankings")
    .select("title, seo_title, meta_description")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!ranking) return {};
  const title = ranking.seo_title ?? `${ranking.title} | FitBase`;
  return {
    title,
    description: ranking.meta_description,
    alternates: { canonical: `/rankings/${slug}/` },
    openGraph: { title, description: ranking.meta_description ?? undefined, url: `/rankings/${slug}/`, type: "website" },
  };
}

export default async function RankingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: ranking } = await supabase
    .from("rankings")
    .select("*, prefectures(name, slug), cities(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!ranking) notFound();

  const { data: rows } = await supabase
    .from("ranking_gyms")
    .select(`
      rank, reason,
      gyms(
        id, slug, name, status, address, area_name,
        monthly_fee_min, total_price_min,
        has_trial, is_female_friendly, has_private_room, has_nutrition_support, supports_contest, is_near_station,
        google_rating, google_review_count,
        gym_images(url, is_cover)
      )
    `)
    .eq("ranking_id", ranking.id)
    .order("rank");

  const gymRows = (rows ?? []).filter((r: any) => r.gyms?.status === "published");

  const { data: related } = await supabase
    .from("rankings")
    .select("title, slug")
    .eq("status", "published")
    .neq("id", ranking.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const { content, toc } = await renderMarkdown(ranking.body_md);
  const pref = ranking.prefectures as any;
  const city = ranking.cities as any;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "ランキング", item: `${siteUrl}/rankings/` },
      { "@type": "ListItem", position: 3, name: ranking.title, item: `${siteUrl}/rankings/${slug}/` },
    ],
  };

  const itemListLd = gymRows.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: gymRows.map((r: any) => ({
          "@type": "ListItem",
          position: r.rank,
          url: `${siteUrl}/gyms/${r.gyms.slug}/`,
          name: r.gyms.name,
        })),
      }
    : null;

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {itemListLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}

      <Breadcrumb
        items={[
          { label: "トップ", href: "/" },
          { label: "ランキング", href: "/rankings/" },
          { label: ranking.title },
        ]}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {ranking.category && <span className="badge badge-blue">{ranking.category}</span>}
        {city && pref && (
          <a href={`/${pref.slug}/${city.slug}/`} className="badge badge-gray">{city.name}</a>
        )}
        {!city && pref && (
          <a href={`/${pref.slug}/`} className="badge badge-gray">{pref.name}</a>
        )}
      </div>
      <h1 className="page-title">{ranking.title}</h1>

      {content && (
        <>
          <TocBox items={toc} />
          <div className="markdown-body" style={{ marginBottom: "2rem" }}>{content}</div>
        </>
      )}

      {gymRows.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 className="section-title">ランキング</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {gymRows.map((r: any) => (
              <div key={r.gyms.id} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "1.75rem",
                      height: "1.75rem",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-white)",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      flexShrink: 0,
                    }}
                  >
                    {r.rank}
                  </span>
                  {r.reason && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", margin: 0 }}>{r.reason}</p>
                  )}
                </div>
                <GymListItem gym={toGymSummary(r.gyms)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {related && related.length > 0 && (
        <section>
          <h2 className="section-title">他のランキングも見る</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {related.map((r: any) => (
              <a key={r.slug} href={`/rankings/${r.slug}/`} className="badge badge-gray" style={{ fontSize: "0.8125rem", padding: "0.4375rem 0.875rem" }}>
                {r.title}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

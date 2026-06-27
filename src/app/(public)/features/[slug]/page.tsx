import { notFound } from "next/navigation";
import Image from "next/image";
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
  const { data } = await supabase.from("features").select("slug").eq("status", "published");
  return (data ?? []).map((f: any) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: feature } = await (supabase as any)
    .from("features")
    .select("title, seo_title, meta_description, eyecatch_image_url, noindex")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!feature) return {};
  const title = feature.seo_title ?? `${feature.title} | FitBase`;
  return {
    title,
    description: feature.meta_description,
    alternates: { canonical: `/features/${slug}/` },
    openGraph: {
      title,
      description: feature.meta_description ?? undefined,
      url: `/features/${slug}/`,
      type: "website",
      images: feature.eyecatch_image_url ? [feature.eyecatch_image_url] : undefined,
    },
    robots: feature.noindex ? { index: false } : undefined,
  };
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: feature } = await (supabase as any)
    .from("features")
    .select("*, prefectures(name, slug), cities(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!feature) notFound();

  const { data: rows } = await supabase
    .from("feature_gyms")
    .select(`
      sort_order, comment,
      gyms(
        id, slug, name, status, address, area_name,
        monthly_fee_min, total_price_min,
        has_trial, is_female_friendly, has_private_room, has_nutrition_support, supports_contest, is_near_station,
        google_rating, google_review_count,
        gym_images(url, is_cover)
      )
    `)
    .eq("feature_id", feature.id)
    .order("sort_order");

  const gymRows = (rows ?? []).filter((r: any) => r.gyms?.status === "published");

  const { data: related } = await supabase
    .from("features")
    .select("title, slug")
    .eq("status", "published")
    .neq("id", feature.id)
    .order("sort_order")
    .limit(4);

  const { content, toc } = await renderMarkdown(feature.body_md);
  const pref = feature.prefectures as any;
  const city = feature.cities as any;
  const faqItems = Array.isArray(feature.faq_json) ? (feature.faq_json as { q: string; a: string }[]) : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "特集", item: `${siteUrl}/features/` },
      { "@type": "ListItem", position: 3, name: feature.title, item: `${siteUrl}/features/${slug}/` },
    ],
  };

  const itemListLd = gymRows.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: gymRows.map((r: any, idx: number) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${siteUrl}/gyms/${r.gyms.slug}/`,
          name: r.gyms.name,
        })),
      }
    : null;

  const faqLd = faqItems.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {itemListLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <Breadcrumb
        items={[
          { label: "トップ", href: "/" },
          { label: "特集", href: "/features/" },
          { label: feature.title },
        ]}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {feature.category && <span className="badge badge-blue">{feature.category}</span>}
        {city && pref && (
          <a href={`/${pref.slug}/${city.slug}/`} className="badge badge-gray">{city.name}</a>
        )}
        {!city && pref && (
          <a href={`/${pref.slug}/`} className="badge badge-gray">{pref.name}</a>
        )}
      </div>
      <h1 className="page-title">{feature.title}</h1>

      {feature.eyecatch_image_url && (
        <Image
          src={feature.eyecatch_image_url}
          alt={feature.title}
          width={1280}
          height={720}
          style={{ width: "100%", height: "auto", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}
          unoptimized
          priority
        />
      )}

      {content && (
        <>
          <TocBox items={toc} />
          <div className="markdown-body" style={{ marginBottom: "2rem" }}>{content}</div>
        </>
      )}

      {gymRows.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 className="section-title">掲載ジム（{gymRows.length}件）</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {gymRows.map((r: any) => (
              <div key={r.gyms.id}>
                {r.comment && (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-600)", backgroundColor: "var(--color-gray-50)", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", marginBottom: 0 }}>
                    {r.comment}
                  </p>
                )}
                <GymListItem gym={toGymSummary(r.gyms)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {faqItems.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 className="section-title">よくある質問</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {faqItems.map((item, idx) => (
              <div key={idx} style={{ border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "0.875rem 1rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.375rem", color: "var(--color-gray-900)" }}>Q. {item.q}</p>
                <p style={{ fontSize: "0.875rem", color: "var(--color-gray-700)", lineHeight: 1.7 }}>A. {item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {related && related.length > 0 && (
        <section>
          <h2 className="section-title">他の特集も見る</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {related.map((f: any) => (
              <a key={f.slug} href={`/features/${f.slug}/`} className="badge badge-gray" style={{ fontSize: "0.8125rem", padding: "0.4375rem 0.875rem" }}>
                {f.title}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

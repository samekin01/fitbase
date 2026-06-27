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

function rankTier(rank: number) {
  if (rank === 1) return { border: "#F2C94C", bg: "#FFFBEA", badgeBg: "#F2C94C", badgeText: "#5C4400", label: "総合1位" };
  if (rank === 2) return { border: "#C7CCD1", bg: "#F7F8F9", badgeBg: "#C7CCD1", badgeText: "#33383D", label: "総合2位" };
  if (rank === 3) return { border: "#E0A872", bg: "#FBF1E8", badgeBg: "#E0A872", badgeText: "#4A2E12", label: "総合3位" };
  return { border: "var(--color-gray-200)", bg: "var(--color-white)", badgeBg: "var(--color-gray-900)", badgeText: "#FFFFFF", label: null as string | null };
}

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
    .select("title, seo_title, meta_description, eyecatch_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!ranking) return {};
  const title = ranking.seo_title ?? `${ranking.title} | FitBase`;
  return {
    title,
    description: ranking.meta_description,
    alternates: { canonical: `/rankings/${slug}/` },
    openGraph: {
      title,
      description: ranking.meta_description ?? undefined,
      url: `/rankings/${slug}/`,
      type: "website",
      images: ranking.eyecatch_image_url ? [ranking.eyecatch_image_url] : undefined,
    },
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
        gym_images(image_url, is_cover)
      )
    `)
    .eq("ranking_id", ranking.id)
    .order("rank", { ascending: false });

  const gymRows = (rows ?? []).filter((r: any) => r.gyms?.status === "published");
  const top3 = [...gymRows].filter((r: any) => r.rank <= 3).sort((a: any, b: any) => a.rank - b.rank);
  const ascRows = [...gymRows].sort((a: any, b: any) => a.rank - b.rank);

  const { data: related } = await supabase
    .from("rankings")
    .select("title, slug")
    .eq("status", "published")
    .neq("id", ranking.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const { content, toc } = await renderMarkdown(ranking.body_md);
  const { content: closingContent } = await renderMarkdown(ranking.closing_md);
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

      {ranking.eyecatch_image_url && (
        <Image
          src={ranking.eyecatch_image_url}
          alt={ranking.title}
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
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>ランキング</h2>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>
              全{gymRows.length}件・{gymRows.length}位から1位まで紹介
            </span>
          </div>

          {top3.length > 0 && (
            <div className="ranking-podium">
              {top3.map((r: any) => {
                const g = toGymSummary(r.gyms);
                const tier = rankTier(r.rank);
                return (
                  <a key={r.gyms.id} href={`#rank-${r.rank}`} className={`ranking-podium__item ranking-podium__item--${r.rank}`}>
                    <span className="ranking-podium__badge" style={{ backgroundColor: tier.badgeBg, color: tier.badgeText }}>
                      {r.rank}
                    </span>
                    <div className="ranking-podium__image-wrap">
                      {g.image_url ? (
                        <Image src={g.image_url} alt={g.name} width={160} height={120} className="ranking-podium__image" unoptimized />
                      ) : (
                        <div className="gym-list-item__no-image" style={{ width: "100%", height: "100%" }}>
                          <span>写真なし</span>
                        </div>
                      )}
                    </div>
                    <div className="ranking-podium__name">{g.name}</div>
                    <div className="ranking-podium__price">
                      月額{" "}
                      {g.monthly_fee_min != null ? (
                        <>
                          <strong>¥{g.monthly_fee_min.toLocaleString()}</strong>〜
                        </>
                      ) : (
                        "要問合せ"
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {ascRows.length > 1 && (
            <div className="ranking-jumpnav">
              {ascRows.map((r: any) => (
                <a key={r.gyms.id} href={`#rank-${r.rank}`} className="ranking-jumpnav__item">
                  <span className="ranking-jumpnav__rank">{r.rank}</span>
                  {r.gyms.name}
                </a>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {gymRows.map((r: any) => {
              const tier = rankTier(r.rank);
              return (
                <div
                  key={r.gyms.id}
                  id={`rank-${r.rank}`}
                  className={`ranking-entry${r.rank <= 3 ? " ranking-entry--top" : ""}`}
                  style={{ borderColor: tier.border, backgroundColor: tier.bg }}
                >
                  <div className="ranking-entry__head">
                    <span className="ranking-entry__rank" style={{ backgroundColor: tier.badgeBg, color: tier.badgeText }}>
                      {r.rank}
                    </span>
                    <h3 className="ranking-entry__name">{r.gyms.name}</h3>
                    {tier.label && (
                      <span className="badge ranking-entry__tier-badge" style={{ backgroundColor: tier.badgeBg, color: tier.badgeText }}>
                        {tier.label}
                      </span>
                    )}
                  </div>
                  {r.reason && (
                    <>
                      <span className="ranking-entry__reason-label">おすすめポイント</span>
                      <p className="ranking-entry__reason">{r.reason}</p>
                    </>
                  )}
                  <GymListItem gym={toGymSummary(r.gyms)} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {closingContent && (
        <section className="ranking-closing markdown-body" style={{ marginBottom: "2.5rem" }}>
          {closingContent}
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

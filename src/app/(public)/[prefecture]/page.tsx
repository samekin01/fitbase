import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { GymListItem } from "@/components/gym/GymListItem";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { GYM_LIST_SELECT, toGymSummary } from "@/lib/gym-query";

export const revalidate = 3600;

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("prefectures").select("slug");
  return (data ?? []).map((p: any) => ({ prefecture: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prefecture: string }>;
}): Promise<Metadata> {
  const { prefecture: slug } = await params;
  const supabase = createAdminClient();
  const { data: pref } = await supabase
    .from("prefectures")
    .select("name, seo_title, meta_description")
    .eq("slug", slug)
    .single();
  if (!pref) return {};
  const title = pref.seo_title ?? `${pref.name}のパーソナルジム一覧`;
  return {
    title,
    description: pref.meta_description,
    alternates: { canonical: `/${slug}/` },
    openGraph: {
      title,
      description: pref.meta_description ?? undefined,
      url: `/${slug}/`,
      type: "website",
    },
  };
}

export default async function PrefecturePage({
  params,
}: {
  params: Promise<{ prefecture: string }>;
}) {
  const { prefecture: slug } = await params;
  const supabase = createAdminClient();

  const { data: pref } = await supabase
    .from("prefectures")
    .select("id, name, slug, intro_text")
    .eq("slug", slug)
    .single();

  if (!pref) notFound();

  const [{ data: cities }, { data: gyms, count }, { data: features }, { data: rankings }] = await Promise.all([
    supabase
      .from("cities")
      .select("id, name, slug")
      .eq("prefecture_id", pref.id)
      .order("sort_order"),
    supabase
      .from("gyms")
      .select(GYM_LIST_SELECT, { count: "exact" })
      .eq("status", "published")
      .eq("prefecture_id", pref.id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(0, 19),
    supabase
      .from("features")
      .select("title, slug, category")
      .eq("status", "published")
      .eq("prefecture_id", pref.id)
      .order("sort_order")
      .limit(6),
    supabase
      .from("rankings")
      .select("title, slug, category")
      .eq("status", "published")
      .eq("prefecture_id", pref.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const totalCount = count ?? 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: `${pref.name}のパーソナルジム`, item: `${siteUrl}/${slug}/` },
    ],
  };

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Breadcrumb
        items={[
          { label: "トップ", href: "/" },
          { label: `${pref.name}のパーソナルジム` },
        ]}
      />

      {/* ページヘッダー */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <h1 className="page-title" style={{ marginBottom: "0.125rem" }}>
          {pref.name}のパーソナルジム一覧
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-gray-500)", marginBottom: pref.intro_text ? "0.875rem" : 0 }}>
          {totalCount}件のジムが見つかりました
        </p>

        {pref.intro_text && (
          <p style={{ fontSize: "0.875rem", color: "var(--color-gray-700)", lineHeight: 1.8, marginBottom: 0 }}>
            {pref.intro_text}
          </p>
        )}
      </div>

      {/* 市区町村で絞り込む */}
      {cities && cities.length > 0 && (
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--color-gray-700)",
              marginBottom: "0.5rem",
            }}
          >
            市区町村から探す
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {cities.map((city: any) => (
              <Link
                key={city.id}
                href={`/${slug}/${city.slug}/`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.3125rem 0.875rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-link)",
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "2px",
                  backgroundColor: "var(--color-gray-50)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ジムリスト */}
      {gyms && gyms.length > 0 ? (
        <>
          {gyms.map((gym: any) => (
            <GymListItem key={gym.slug} gym={toGymSummary(gym)} />
          ))}

          {totalCount > 20 && (
            <div style={{ textAlign: "center", paddingTop: "1.5rem" }}>
              <Link href={`/search?pref=${slug}`} className="btn btn-secondary btn-lg">
                {pref.name}のジムを全{totalCount}件検索
              </Link>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.9375rem", color: "var(--color-gray-500)" }}>
            現在ジム情報がありません。
          </p>
        </div>
      )}

      {((features && features.length > 0) || (rankings && rankings.length > 0)) && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2 className="section-title">{pref.name}の特集・ランキング</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {(rankings ?? []).map((r: any) => (
              <Link key={r.slug} href={`/rankings/${r.slug}/`} className="badge badge-blue" style={{ fontSize: "0.8125rem", padding: "0.4375rem 0.875rem" }}>
                {r.title}
              </Link>
            ))}
            {(features ?? []).map((f: any) => (
              <Link key={f.slug} href={`/features/${f.slug}/`} className="badge badge-gray" style={{ fontSize: "0.8125rem", padding: "0.4375rem 0.875rem" }}>
                {f.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

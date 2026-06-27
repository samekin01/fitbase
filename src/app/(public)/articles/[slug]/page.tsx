import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TocBox } from "@/components/content/TocBox";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 3600;

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("articles").select("slug").eq("status", "published");
  return (data ?? []).map((a: any) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: article } = await supabase
    .from("articles")
    .select("title, seo_title, meta_description, eyecatch_image_url, noindex")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!article) return {};
  const title = article.seo_title ?? `${article.title} | FitBase コラム`;
  return {
    title,
    description: article.meta_description,
    alternates: { canonical: `/articles/${slug}/` },
    robots: article.noindex ? { index: false } : undefined,
    openGraph: {
      title,
      description: article.meta_description ?? undefined,
      url: `/articles/${slug}/`,
      type: "article",
      images: article.eyecatch_image_url ? [article.eyecatch_image_url] : undefined,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!article) notFound();

  const { data: related } = await supabase
    .from("articles")
    .select("title, slug, category, eyecatch_image_url")
    .eq("status", "published")
    .neq("id", article.id)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(4);

  const { content, toc } = await renderMarkdown(article.body_md);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";

  const articleLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(article.eyecatch_image_url ? { image: [article.eyecatch_image_url] } : {}),
    ...(article.published_at ? { datePublished: article.published_at } : {}),
    dateModified: article.updated_at,
    ...(article.supervisor_name ? { author: { "@type": "Person", name: article.supervisor_name } } : {}),
    publisher: { "@type": "Organization", name: "FitBase" },
    mainEntityOfPage: `${siteUrl}/articles/${slug}/`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "コラム・記事", item: `${siteUrl}/articles/` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${siteUrl}/articles/${slug}/` },
    ],
  };

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem", maxWidth: "840px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <Breadcrumb
        items={[
          { label: "トップ", href: "/" },
          { label: "コラム・記事", href: "/articles/" },
          { label: article.title },
        ]}
      />

      {article.category && (
        <span className="badge badge-blue" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
          {article.category}
        </span>
      )}
      <h1 className="page-title">{article.title}</h1>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)", marginBottom: "1.5rem" }}>
        {article.published_at && new Date(article.published_at).toLocaleDateString("ja-JP")}
        {article.supervisor_name && ` ・監修: ${article.supervisor_name}`}
      </p>

      {article.eyecatch_image_url && (
        <Image
          src={article.eyecatch_image_url}
          alt={article.title}
          width={840}
          height={460}
          style={{ width: "100%", height: "auto", maxHeight: "420px", objectFit: "cover", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}
          unoptimized
          priority
        />
      )}

      <TocBox items={toc} />

      <div className="markdown-body">{content}</div>

      {related && related.length > 0 && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2 className="section-title">あわせて読みたい</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {related.map((a: any) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}/`}
                style={{ display: "block", padding: "0.875rem 1rem", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", color: "var(--color-gray-900)", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}
              >
                {a.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

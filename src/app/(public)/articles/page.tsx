import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "コラム・記事一覧 | FitBase",
  description: "東海エリアのパーソナルジム選びに役立つコラム・記事一覧。",
  alternates: { canonical: "/articles/" },
};

export default async function ArticlesListPage() {
  const supabase = createAdminClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("title, slug, category, eyecatch_image_url, supervisor_name, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
      <Breadcrumb items={[{ label: "トップ", href: "/" }, { label: "コラム・記事" }]} />

      <h1 className="page-title">コラム・記事一覧</h1>
      <p className="page-subtitle">パーソナルジムの選び方・トレーニングの知識など、専門家監修のコラムをお届けします。</p>

      {articles && articles.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {articles.map((a: any) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}/`}
              className="card card-hover"
              style={{ display: "flex", gap: "1rem", padding: "1rem 1.25rem", textDecoration: "none", alignItems: "center" }}
            >
              {a.eyecatch_image_url && (
                <Image
                  src={a.eyecatch_image_url}
                  alt={a.title}
                  width={120}
                  height={80}
                  style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "var(--radius-sm)", flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                {a.category && (
                  <span className="badge badge-blue" style={{ marginBottom: "0.375rem", display: "inline-block" }}>
                    {a.category}
                  </span>
                )}
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.25rem" }}>
                  {a.title}
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                  {a.published_at && new Date(a.published_at).toLocaleDateString("ja-JP")}
                  {a.supervisor_name && ` ・監修: ${a.supervisor_name}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.9375rem", color: "var(--color-gray-500)" }}>現在公開中の記事がありません。</p>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "特集一覧 | FitBase",
  description: "東海エリアのパーソナルジムをテーマ・エリア別にまとめた特集一覧。",
  alternates: { canonical: "/features/" },
};

export default async function FeaturesListPage() {
  const supabase = createAdminClient();
  const { data: features } = await supabase
    .from("features")
    .select("title, slug, category, prefectures(name), cities(name)")
    .eq("status", "published")
    .order("sort_order");

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
      <Breadcrumb items={[{ label: "トップ", href: "/" }, { label: "特集" }]} />

      <h1 className="page-title">特集一覧</h1>
      <p className="page-subtitle">テーマやエリアで選んだ、おすすめパーソナルジムの特集記事です。</p>

      {features && features.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {features.map((f: any) => (
            <Link
              key={f.slug}
              href={`/features/${f.slug}/`}
              className="card card-hover"
              style={{ display: "block", padding: "1rem 1.25rem", textDecoration: "none" }}
            >
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem" }}>
                {f.category && <span className="badge badge-blue">{f.category}</span>}
                {(f.cities?.name ?? f.prefectures?.name) && (
                  <span className="badge badge-gray">{f.cities?.name ?? f.prefectures?.name}</span>
                )}
              </div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gray-900)" }}>{f.title}</h2>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.9375rem", color: "var(--color-gray-500)" }}>現在公開中の特集がありません。</p>
        </div>
      )}
    </div>
  );
}

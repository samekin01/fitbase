import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ランキング一覧 | FitBase",
  description: "東海エリアのパーソナルジムをエリア・テーマ別にランキング形式でまとめた一覧。",
  alternates: { canonical: "/rankings/" },
};

export default async function RankingsListPage() {
  const supabase = createAdminClient();
  const { data: rankings } = await supabase
    .from("rankings")
    .select("title, slug, category, eyecatch_image_url, prefectures(name), cities(name)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
      <Breadcrumb items={[{ label: "トップ", href: "/" }, { label: "ランキング" }]} />

      <h1 className="page-title">ランキング一覧</h1>
      <p className="page-subtitle">エリアやテーマ別に厳選した、おすすめパーソナルジムランキングです。</p>

      {rankings && rankings.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {rankings.map((r: any) => (
            <Link
              key={r.slug}
              href={`/rankings/${r.slug}/`}
              className="card card-hover"
              style={{ display: "flex", gap: "1rem", padding: "1rem 1.25rem", textDecoration: "none", alignItems: "center" }}
            >
              {r.eyecatch_image_url && (
                <Image
                  src={r.eyecatch_image_url}
                  alt={r.title}
                  width={128}
                  height={72}
                  style={{ width: "128px", height: "72px", objectFit: "cover", borderRadius: "var(--radius-sm)", flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem" }}>
                  {r.category && <span className="badge badge-blue">{r.category}</span>}
                  {(r.cities?.name ?? r.prefectures?.name) && (
                    <span className="badge badge-gray">{r.cities?.name ?? r.prefectures?.name}</span>
                  )}
                </div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gray-900)" }}>{r.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--color-white)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.9375rem", color: "var(--color-gray-500)" }}>現在公開中のランキングがありません。</p>
        </div>
      )}
    </div>
  );
}

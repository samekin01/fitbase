import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { GymListItem } from "@/components/gym/GymListItem";
import { TocBox } from "@/components/content/TocBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { renderMarkdown } from "@/lib/markdown";
import { toGymSummary } from "@/lib/gym-query";
import { groupFeatureGymRows } from "@/lib/feature-gym-sections";

export const dynamic = "force-dynamic";
export const metadata = { title: "プレビュー | FitBase CMS", robots: { index: false } };

// 公開ページ（(public)/features/[slug]/page.tsx）と同じ見た目で、保存済みの下書き内容を
// 公開前に確認するための管理画面専用プレビュー。status=publishedの制約をかけない点のみ異なる。
export default async function FeaturePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: feature } = await (supabase as any)
    .from("features")
    .select("*, prefectures(name, slug), cities(name, slug)")
    .eq("id", id)
    .single();

  if (!feature) notFound();

  const { data: rows } = await supabase
    .from("feature_gyms")
    .select(`
      sort_order, comment, section_label, headline,
      gyms(
        id, slug, name, status, address, area_name,
        monthly_fee_min, total_price_min,
        has_trial, is_female_friendly, has_private_room, has_nutrition_support, supports_contest, is_near_station,
        google_rating, google_review_count,
        gym_images(image_url, is_cover)
      )
    `)
    .eq("feature_id", feature.id)
    .order("sort_order");

  const gymRows = (rows ?? []).filter((r: any) => r.gyms?.status === "published");
  const gymGroups = groupFeatureGymRows(gymRows as any);

  const { content, toc } = await renderMarkdown(feature.body_md);
  const pref = feature.prefectures as any;
  const city = feature.cities as any;
  const faqItems = Array.isArray(feature.faq_json) ? (feature.faq_json as { q: string; a: string }[]) : [];

  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          backgroundColor: "#1F2937",
          color: "#FFFFFF",
          padding: "0.625rem 1rem",
          marginBottom: "1.5rem",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>プレビュー（保存済みの内容を表示しています）</span>
          <StatusBadge status={feature.status} />
        </div>
        <Link href={`/admin/features/${id}`} style={{ fontSize: "0.8125rem", color: "#FFFFFF", textDecoration: "underline" }}>
          編集画面に戻る
        </Link>
      </div>

      <div className="container" style={{ maxWidth: "800px", paddingBottom: "3rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          {feature.category && <span className="badge badge-blue">{feature.category}</span>}
          {city && pref && <span className="badge badge-gray">{city.name}</span>}
          {!city && pref && <span className="badge badge-gray">{pref.name}</span>}
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

        {gymGroups.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {gymGroups.map((group, gi) => (
                <div key={gi}>
                  {group.area_label && (
                    <h2 className="section-title">{group.area_label}</h2>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {group.rows.map((r: any, idx: number) => (
                      <div key={r.gyms.id}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.0625rem", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.5rem" }}>
                          {!r.headline && (
                            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.625rem", height: "1.625rem", borderRadius: "50%", backgroundColor: "var(--color-gray-900)", color: "#FFFFFF", fontSize: "0.8125rem", flexShrink: 0 }}>
                              {idx + 1}
                            </span>
                          )}
                          {r.headline || r.gyms.name}
                        </h3>
                        {r.comment && (
                          <p style={{ fontSize: "0.875rem", color: "var(--color-gray-700)", lineHeight: 1.7, marginBottom: "0.625rem" }}>
                            {r.comment}
                          </p>
                        )}
                        <GymListItem gym={toGymSummary(r.gyms)} />
                      </div>
                    ))}
                  </div>
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
      </div>
    </div>
  );
}

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { MapPinIcon, BuildingOfficeIcon, TrainIcon, ChevronRightIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "エリアマスタ | FitBase CMS" };

export default async function AreasHubPage() {
  const supabase = createAdminClient();

  const [{ count: prefectureCount }, { count: cityCount }, { count: stationCount }] = await Promise.all([
    supabase.from("prefectures").select("*", { count: "exact", head: true }),
    supabase.from("cities").select("*", { count: "exact", head: true }),
    supabase.from("stations").select("*", { count: "exact", head: true }),
  ]);

  const items = [
    { label: "都道府県", description: "東海4県の都道府県マスタ", count: prefectureCount ?? 0, href: "/admin/areas/prefectures", icon: MapPinIcon },
    { label: "市区町村", description: "都道府県に属する市区町村マスタ", count: cityCount ?? 0, href: "/admin/areas/cities", icon: BuildingOfficeIcon },
    { label: "駅マスタ", description: "最寄駅リンクに使う駅データ（CSV一括インポート対応）", count: stationCount ?? 0, href: "/admin/areas/stations", icon: TrainIcon },
  ];

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        エリアマスタ
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card card-hover"
            style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.125rem", textDecoration: "none" }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-gray-100)",
                color: "var(--color-gray-700)",
                flexShrink: 0,
              }}
            >
              <item.icon size={22} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "0.125rem" }}>{item.label}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-gray-500)" }}>{item.description}</p>
            </div>
            <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-gray-700)", flexShrink: 0 }}>
              {item.count.toLocaleString()}件
            </span>
            <ChevronRightIcon size={16} style={{ color: "var(--color-gray-400)", flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

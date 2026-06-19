import Link from "next/link";
import { GlobeAltIcon, ClipboardListIcon, ChevronRightIcon } from "@/components/ui/Icons";

export const metadata = { title: "Google Places 取込 | FitBase CMS" };

export default function PlacesPage() {
  const items = [
    {
      label: "新規取込ジョブ実行",
      description: "Google Placesからエリア・キーワードを指定してジム情報を取り込みます",
      href: "/admin/places/import",
      icon: GlobeAltIcon,
    },
    {
      label: "取込履歴",
      description: "過去に実行した取込ジョブの結果一覧",
      href: "/admin/places/history",
      icon: ClipboardListIcon,
    },
  ];

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        <GlobeAltIcon size={20} />
        Google Places 取込
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
            <ChevronRightIcon size={16} style={{ color: "var(--color-gray-400)", flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

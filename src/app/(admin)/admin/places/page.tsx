import Link from "next/link";

export const metadata = { title: "Google Places 取込 | FitBase CMS" };

export default function PlacesPage() {
  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--color-gray-900)" }}>
        Google Places 取込
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Link
          href="/admin/places/import"
          style={{
            display: "block",
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "0.875rem 1rem",
            textDecoration: "none",
            color: "var(--color-gray-900)",
            fontWeight: 500,
          }}
        >
          新規取込ジョブ実行
        </Link>
        <Link
          href="/admin/places/history"
          style={{
            display: "block",
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "0.875rem 1rem",
            textDecoration: "none",
            color: "var(--color-gray-900)",
            fontWeight: 500,
          }}
        >
          取込履歴
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="パンくずリスト">
      <ol
        className="breadcrumb"
        style={{ listStyle: "none", padding: 0, margin: 0 }}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => (
          <li
            key={index}
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && (
              <span className="breadcrumb__sep" aria-hidden="true">
                &rsaquo;
              </span>
            )}
            {item.href ? (
              <Link href={item.href} itemProp="item">
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span itemProp="name" style={{ color: "var(--color-gray-700)" }}>
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

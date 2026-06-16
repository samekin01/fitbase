import type { TocItem } from "@/lib/markdown";

export function TocBox({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav className="toc-box" aria-label="目次">
      <p className="toc-box__title">目次</p>
      <ol className="toc-box__list">
        {items.map((item) => (
          <li key={item.id} style={{ marginLeft: item.depth === 3 ? "1rem" : 0 }}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

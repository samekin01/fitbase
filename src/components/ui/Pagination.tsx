import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function Pagination({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav aria-label="ページネーション" className="pagination">
      {/* 前へ */}
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className="pagination__item" aria-label="前のページ">
          &lsaquo;
        </Link>
      ) : (
        <span className="pagination__item pagination__item--disabled" aria-hidden="true">
          &lsaquo;
        </span>
      )}

      {/* ページ番号 */}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="pagination__item pagination__item--disabled">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page as number)}
            className={`pagination__item${page === currentPage ? " pagination__item--active" : ""}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        )
      )}

      {/* 次へ */}
      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className="pagination__item" aria-label="次のページ">
          &rsaquo;
        </Link>
      ) : (
        <span className="pagination__item pagination__item--disabled" aria-hidden="true">
          &rsaquo;
        </span>
      )}
    </nav>
  );
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
}

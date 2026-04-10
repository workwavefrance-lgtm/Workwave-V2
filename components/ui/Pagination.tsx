import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
};

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  function pageUrl(page: number) {
    if (page === 1) return baseUrl;
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}`;
  }

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center gap-2 mt-12">
      {currentPage > 1 && (
        <Link
          href={pageUrl(currentPage - 1)}
          className="px-4 py-2 rounded-full border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-250"
        >
          Precedent
        </Link>
      )}
      {pages.map((page, i) =>
        page === "..." ? (
          <span
            key={`dots-${i}`}
            className="px-2 py-2 text-sm text-[var(--text-tertiary)]"
          >
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={pageUrl(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-250 ${
              page === currentPage
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
          >
            {page}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link
          href={pageUrl(currentPage + 1)}
          className="px-4 py-2 rounded-full border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-250"
        >
          Suivant
        </Link>
      )}
    </nav>
  );
}

"use client";

export default function AdminTablePagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(page, totalPages);

  return (
    <div className="flex items-center justify-between pt-3">
      <span
        className="text-[11px] tabular-nums"
        style={{ color: "var(--admin-text-tertiary)" }}
      >
        {total} résultat{total > 1 ? "s" : ""}
      </span>

      <div className="flex items-center gap-1">
        <NavButton
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          label="←"
        />

        {pages.map((p, i) =>
          p === null ? (
            <span
              key={`dots-${i}`}
              className="px-1 text-[11px]"
              style={{ color: "var(--admin-text-tertiary)" }}
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="w-7 h-7 rounded-md text-[11px] font-medium transition-colors duration-150 cursor-pointer"
              style={{
                backgroundColor:
                  p === page ? "var(--admin-accent)" : "transparent",
                color:
                  p === page ? "#FAFAFA" : "var(--admin-text-secondary)",
              }}
            >
              {p}
            </button>
          )
        )}

        <NavButton
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          label="→"
        />
      </div>
    </div>
  );
}

function NavButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-7 h-7 rounded-md text-xs font-medium transition-colors duration-150 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
      style={{
        color: "var(--admin-text-secondary)",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) =>
        !disabled &&
        (e.currentTarget.style.backgroundColor = "var(--admin-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
    >
      {label}
    </button>
  );
}

function getVisiblePages(
  current: number,
  total: number
): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 3) return [1, 2, 3, 4, null, total];
  if (current >= total - 2)
    return [1, null, total - 3, total - 2, total - 1, total];

  return [1, null, current - 1, current, current + 1, null, total];
}

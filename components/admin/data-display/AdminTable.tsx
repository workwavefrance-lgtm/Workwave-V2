"use client";

import type { SortDirection } from "@/lib/types/admin";

export type AdminColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export default function AdminTable<T extends { id: number | string }>({
  columns,
  data,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = "Aucune donnée",
}: {
  columns: AdminColumn<T>[];
  data: T[];
  sortKey?: string;
  sortDir?: SortDirection;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg
          className="w-10 h-10 mb-3"
          style={{ color: "var(--admin-text-tertiary)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p
          className="text-sm"
          style={{ color: "var(--admin-text-tertiary)" }}
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--admin-border)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left text-[11px] font-medium uppercase tracking-wider px-3 py-2.5 ${col.className || ""}`}
                style={{ color: "var(--admin-text-tertiary)" }}
              >
                {col.sortable && onSort ? (
                  <button
                    onClick={() => onSort(col.key)}
                    className="flex items-center gap-1 hover:text-[var(--admin-text-secondary)] transition-colors duration-150 cursor-pointer"
                  >
                    {col.label}
                    <SortIcon
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDir : undefined}
                    />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`transition-colors duration-150 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
              style={{ borderBottom: "1px solid var(--admin-border)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--admin-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 text-xs ${col.className || ""}`}
                  style={{ color: "var(--admin-text)" }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction?: SortDirection;
}) {
  if (!active) {
    return (
      <svg
        className="w-3 h-3 opacity-30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      style={{ color: "var(--admin-accent)" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
      />
    </svg>
  );
}

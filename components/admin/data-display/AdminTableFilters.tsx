"use client";

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterConfig = {
  key: string;
  label: string;
  options: FilterOption[];
};

export default function AdminTableFilters({
  filters,
  values,
  onChange,
}: {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-medium"
            style={{ color: "var(--admin-text-tertiary)" }}
          >
            {filter.label}
          </span>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--admin-border)" }}>
            {filter.options.map((opt) => {
              const isActive = (values[filter.key] || filter.options[0].value) === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange(filter.key, opt.value)}
                  className="px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 cursor-pointer"
                  style={{
                    backgroundColor: isActive ? "var(--admin-hover)" : "transparent",
                    color: isActive ? "var(--admin-text)" : "var(--admin-text-tertiary)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

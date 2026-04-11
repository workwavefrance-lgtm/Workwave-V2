"use client";

export default function AdminSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label
          className="block text-[11px] font-medium mb-1.5"
          style={{ color: "var(--admin-text-secondary)" }}
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-colors duration-150 cursor-pointer appearance-none"
        style={{
          backgroundColor: "var(--admin-bg)",
          border: "1px solid var(--admin-border)",
          color: value ? "var(--admin-text)" : "var(--admin-text-tertiary)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          paddingRight: "32px",
        }}
        onFocus={(e) =>
          (e.target.style.borderColor = "var(--admin-accent)")
        }
        onBlur={(e) =>
          (e.target.style.borderColor = "var(--admin-border)")
        }
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

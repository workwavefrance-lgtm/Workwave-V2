"use client";

export default function AdminInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "number" | "password";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      {label && (
        <label
          className="block text-[11px] font-medium mb-1.5"
          style={{ color: "var(--admin-text-secondary)" }}
        >
          {label}
          {required && (
            <span style={{ color: "var(--admin-danger)" }}> *</span>
          )}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg text-xs outline-none transition-colors duration-150 disabled:opacity-50"
        style={{
          backgroundColor: "var(--admin-bg)",
          border: "1px solid var(--admin-border)",
          color: "var(--admin-text)",
        }}
        onFocus={(e) =>
          (e.target.style.borderColor = "var(--admin-accent)")
        }
        onBlur={(e) =>
          (e.target.style.borderColor = "var(--admin-border)")
        }
      />
    </div>
  );
}

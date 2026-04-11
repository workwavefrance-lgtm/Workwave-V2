"use client";

const VARIANTS = {
  primary: {
    bg: "var(--admin-accent)",
    hoverBg: "#059669",
    text: "#FAFAFA",
    border: "transparent",
  },
  secondary: {
    bg: "transparent",
    hoverBg: "var(--admin-hover)",
    text: "var(--admin-text)",
    border: "var(--admin-border)",
  },
  danger: {
    bg: "rgba(239, 68, 68, 0.1)",
    hoverBg: "rgba(239, 68, 68, 0.2)",
    text: "#EF4444",
    border: "rgba(239, 68, 68, 0.2)",
  },
  ghost: {
    bg: "transparent",
    hoverBg: "var(--admin-hover)",
    text: "var(--admin-text-secondary)",
    border: "transparent",
  },
} as const;

type ButtonVariant = keyof typeof VARIANTS;

export default function AdminButton({
  children,
  variant = "primary",
  size = "default",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "default";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        size === "sm" ? "px-2.5 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs"
      } ${className}`}
      style={{
        backgroundColor: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
      }}
      onMouseEnter={(e) =>
        !isDisabled &&
        (e.currentTarget.style.backgroundColor = v.hoverBg)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = v.bg)
      }
    >
      {loading && (
        <svg
          className="w-3 h-3 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

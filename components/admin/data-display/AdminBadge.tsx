"use client";

const VARIANTS = {
  default: {
    bg: "var(--admin-hover)",
    text: "var(--admin-text-secondary)",
  },
  success: {
    bg: "rgba(16, 185, 129, 0.1)",
    text: "var(--admin-success)",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.1)",
    text: "var(--admin-warning)",
  },
  danger: {
    bg: "rgba(239, 68, 68, 0.1)",
    text: "var(--admin-danger)",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "var(--admin-info)",
  },
  accent: {
    bg: "var(--admin-accent-soft)",
    text: "var(--admin-accent)",
  },
} as const;

type BadgeVariant = keyof typeof VARIANTS;

export default function AdminBadge({
  children,
  variant = "default",
  dot = false,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}) {
  const v = VARIANTS[variant];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: v.bg, color: v.text }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: v.text }}
        />
      )}
      {children}
    </span>
  );
}

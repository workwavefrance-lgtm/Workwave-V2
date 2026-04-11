"use client";

export default function AdminDeltaBadge({
  value,
  suffix = "%",
  invert = false,
}: {
  value: number;
  suffix?: string;
  invert?: boolean;
}) {
  const isPositive = invert ? value < 0 : value > 0;
  const isNeutral = value === 0;

  const color = isNeutral
    ? "var(--admin-text-tertiary)"
    : isPositive
      ? "#10B981"
      : "#EF4444";

  const bg = isNeutral
    ? "rgba(250, 250, 250, 0.05)"
    : isPositive
      ? "rgba(16, 185, 129, 0.1)"
      : "rgba(239, 68, 68, 0.1)";

  const arrow = isNeutral ? "→" : value > 0 ? "↑" : "↓";

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium tabular-nums"
      style={{ backgroundColor: bg, color }}
    >
      <span className="text-[10px]">{arrow}</span>
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

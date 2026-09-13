"use client";

export default function AdminChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string; color?: string }[];
  label?: string;
  valueFormatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-xl"
      style={{
        backgroundColor: "var(--admin-card-hi)",
        border: "1px solid var(--admin-border)",
      }}
    >
      {label && (
        <p className="text-[10px] mb-1" style={{ color: "var(--admin-text-secondary)" }}>
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="font-medium tabular-nums" style={{ color: "var(--admin-text)" }}>
          {valueFormatter
            ? valueFormatter(entry.value as number, entry.name ?? "")
            : entry.value}
        </p>
      ))}
    </div>
  );
}

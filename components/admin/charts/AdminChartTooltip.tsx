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
        backgroundColor: "#1A1A1A",
        border: "1px solid #2A2A2A",
      }}
    >
      {label && (
        <p className="text-[10px] mb-1" style={{ color: "#737373" }}>
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="font-medium tabular-nums" style={{ color: entry.color }}>
          {valueFormatter
            ? valueFormatter(entry.value as number, entry.name ?? "")
            : entry.value}
        </p>
      ))}
    </div>
  );
}

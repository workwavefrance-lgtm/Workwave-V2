"use client";

import type { DatePeriod } from "@/lib/types/admin";

type PeriodOption = { label: string; value: DatePeriod };

export const DEFAULT_PERIODS: PeriodOption[] = [
  { label: "7j", value: "7d" },
  { label: "30j", value: "30d" },
  { label: "90j", value: "90d" },
  { label: "12m", value: "12m" },
];

// Variante avec le jour en cours (timeline en direct), utilisée par l'analytics.
export const PERIODS_WITH_TODAY: PeriodOption[] = [
  { label: "Auj.", value: "today" },
  ...DEFAULT_PERIODS,
];

export default function AdminDatePicker({
  value,
  onChange,
  periods = DEFAULT_PERIODS,
}: {
  value: DatePeriod;
  onChange: (value: DatePeriod) => void;
  periods?: PeriodOption[];
}) {
  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--admin-border)" }}
    >
      {periods.map((period) => {
        const isActive = value === period.value;
        return (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className="px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: isActive ? "var(--admin-accent)" : "transparent",
              color: isActive ? "#FAFAFA" : "var(--admin-text-tertiary)",
            }}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}

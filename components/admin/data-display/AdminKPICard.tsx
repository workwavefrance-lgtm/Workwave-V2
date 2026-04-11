"use client";

import AdminDeltaBadge from "./AdminDeltaBadge";
import AdminSparkline from "../charts/AdminSparkline";

export default function AdminKPICard({
  title,
  value,
  delta,
  deltaSuffix = "%",
  deltaInvert = false,
  sparklineData,
  icon,
}: {
  title: string;
  value: string | number;
  delta?: number;
  deltaSuffix?: string;
  deltaInvert?: boolean;
  sparklineData?: number[];
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-colors duration-150"
      style={{
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
            >
              <span style={{ color: "#10B981" }}>{icon}</span>
            </div>
          )}
          <span
            className="text-xs font-medium"
            style={{ color: "var(--admin-text-secondary)" }}
          >
            {title}
          </span>
        </div>
        {delta !== undefined && (
          <AdminDeltaBadge
            value={delta}
            suffix={deltaSuffix}
            invert={deltaInvert}
          />
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <p
          className="text-3xl font-semibold tracking-tight tabular-nums"
          style={{ color: "var(--admin-text)" }}
        >
          {value}
        </p>
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-20 h-8 shrink-0">
            <AdminSparkline data={sparklineData} />
          </div>
        )}
      </div>
    </div>
  );
}

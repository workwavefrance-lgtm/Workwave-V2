"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import AdminChartTooltip from "./AdminChartTooltip";

export default function AdminAreaChartComponent({
  data,
  dataKey,
  xKey = "date",
  color = "#10B981",
  ghostDataKey,
  ghostColor = "#404040",
  height = 280,
  formatter,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  ghostDataKey?: string;
  ghostColor?: string;
  height?: number;
  formatter?: (value: number, name: string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`area-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1F1F1F"
          vertical={false}
        />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: "#404040" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#404040" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          content={<AdminChartTooltip valueFormatter={formatter} />}
          cursor={{ stroke: "#1F1F1F" }}
        />
        {ghostDataKey && (
          <Area
            type="monotone"
            dataKey={ghostDataKey}
            stroke={ghostColor}
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="none"
            dot={false}
            isAnimationActive={false}
          />
        )}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#area-${dataKey})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import AdminChartTooltip from "./AdminChartTooltip";

export default function AdminBarChartComponent({
  data,
  dataKey,
  xKey = "name",
  color = "#10B981",
  height = 280,
  formatter,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  formatter?: (value: number, name: string) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
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
          cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

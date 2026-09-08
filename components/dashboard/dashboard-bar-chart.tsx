/**
 * Bar chart for dashboard overviews.
 *
 * Uses CSS theme tokens so it matches the red card palette.
 */
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";

export type ChartDatum = {
  name: string;
  value: number;
};

export function DashboardBarChart({
  data,
  valueSuffix = "",
  emptyTitle = "No data yet",
  emptyDescription = "Counts will appear here as records are added.",
}: {
  data: ChartDatum[];
  valueSuffix?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const hasValues = data.some((item) => item.value > 0);

  if (!hasValues) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#c4b0ae", fontSize: 12, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#c4b0ae", fontSize: 12, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.06)" }}
            contentStyle={{
              background: "#1f1416",
              border: "1px solid rgba(138, 90, 90, 0.5)",
              borderRadius: 12,
              color: "#fff",
              fontWeight: 700,
            }}
            formatter={(value) => [`${value}${valueSuffix}`, ""]}
          />
          <Bar
            dataKey="value"
            fill="var(--color-primary)"
            radius={[8, 8, 0, 0]}
            maxBarSize={64}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPct, formatProductId, formatVolume } from "@/lib/bazaar/format";

type ChartRow = {
  id: string;
  value: number;
};

type RankedBarChartProps = {
  data: ChartRow[];
  valueLabel: string;
  format: "volume" | "percent";
  barColor: string;
};

function formatChartValue(format: RankedBarChartProps["format"], value: number) {
  return format === "percent" ? formatPct(value / 100) : formatVolume(value);
}

function truncateLabel(id: string) {
  const label = formatProductId(id);
  return label.length > 22 ? `${label.slice(0, 21)}…` : label;
}

export function RankedBarChart({
  data,
  valueLabel,
  format,
  barColor,
}: RankedBarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data.map((row) => ({
    ...row,
    label: truncateLabel(row.id),
  }));

  if (!mounted) {
    return <div className="h-[28rem] w-full" aria-hidden />;
  }

  return (
    <div className="h-[28rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d4d4d8" />
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatChartValue(format, value)}
            tick={{ fill: "#71717a", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={148}
            tick={{ fill: "#3f3f46", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(24, 24, 27, 0.06)" }}
            formatter={(value) => [
              formatChartValue(
                format,
                typeof value === "number" ? value : Number(value),
              ),
              valueLabel,
            ]}
            labelFormatter={(_, payload) => {
              const id = payload?.[0]?.payload?.id;
              return typeof id === "string" ? formatProductId(id) : "";
            }}
          />
          <Bar dataKey="value" fill={barColor} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

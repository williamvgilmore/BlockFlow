"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCoins, formatPct, formatVolume } from "@/lib/bazaar/format";

export type HistoryChartPoint = {
  observedAt: string;
  buyPrice?: number;
  sellPrice?: number;
  spreadPct?: number;
  cashFlow?: number;
};

type TimeSeriesChartProps = {
  data: HistoryChartPoint[];
  series: Array<{
    dataKey: "buyPrice" | "sellPrice" | "spreadPct" | "cashFlow";
    name: string;
    color: string;
  }>;
  format: "coins" | "percent" | "volume";
  heightClassName?: string;
};

function formatTick(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAxis(format: TimeSeriesChartProps["format"], value: number) {
  if (format === "percent") {
    return formatPct(value);
  }
  if (format === "volume") {
    return formatVolume(value);
  }
  return formatCoins(value);
}

export function TimeSeriesChart({
  data,
  series,
  format,
  heightClassName = "h-64",
}: TimeSeriesChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (data.length < 2) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Not enough snapshots yet to draw a history chart.
      </p>
    );
  }

  if (!mounted) {
    return <div className={`${heightClassName} w-full`} aria-hidden />;
  }

  return (
    <div className={`${heightClassName} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
          <XAxis
            dataKey="observedAt"
            tickFormatter={formatTick}
            tick={{ fill: "#71717a", fontSize: 11 }}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(value: number) => formatAxis(format, value)}
            tick={{ fill: "#71717a", fontSize: 11 }}
            width={72}
          />
          <Tooltip
            labelFormatter={(label) =>
              typeof label === "string" ? formatTick(label) : ""
            }
            formatter={(value, name) => [
              formatAxis(format, typeof value === "number" ? value : Number(value)),
              String(name),
            ]}
          />
          {series.length > 1 ? <Legend /> : null}
          {series.map((item) => (
            <Line
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              name={item.name}
              stroke={item.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

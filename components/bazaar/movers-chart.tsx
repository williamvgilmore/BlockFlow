"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPct, formatProductId } from "@/lib/bazaar/format";
import type { MoverRow } from "@/lib/bazaar/history";

type MoversChartProps = {
  rows: MoverRow[];
};

export function MoversChart({ rows }: MoversChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = rows.map((row) => ({
    id: row.id,
    label:
      formatProductId(row.id).length > 22
        ? `${formatProductId(row.id).slice(0, 21)}…`
        : formatProductId(row.id),
    value: row.changePct * 100,
  }));

  if (!mounted) {
    return <div className="h-80 w-full" aria-hidden />;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#d4d4d8" />
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatPct(value / 100)}
            tick={{ fill: "#71717a", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={148}
            tick={{ fill: "#3f3f46", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [
              formatPct((typeof value === "number" ? value : Number(value)) / 100),
              "Buy price change",
            ]}
            labelFormatter={(_, payload) => {
              const id = payload?.[0]?.payload?.id;
              return typeof id === "string" ? formatProductId(id) : "";
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((row) => (
              <Cell
                key={row.id}
                fill={row.value >= 0 ? "#059669" : "#a1a1aa"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

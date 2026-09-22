"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { TreemapNode } from "recharts";
import { TimeSeriesChart } from "@/components/bazaar/time-series-chart";
import { formatCoins, formatPct, formatVolume } from "@/lib/bazaar/format";
import type { ProductHistoryPoint } from "@/lib/bazaar/history";
import type { CashFlowLeaf } from "@/lib/bazaar/overview";

type TooltipPayload = {
  name?: string;
  value?: number;
  sharePct?: number;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function LeafDialog({
  leaf,
  onClose,
}: {
  leaf: CashFlowLeaf;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<ProductHistoryPoint[] | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (leaf.isOther) {
      setHistory([]);
      return;
    }

    const controller = new AbortController();
    setHistory(null);

    void fetch(`/api/bazaar/history?productId=${encodeURIComponent(leaf.id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("history request failed");
        }
        return (await response.json()) as ProductHistoryPoint[];
      })
      .then((points) => {
        setHistory(Array.isArray(points) ? points : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setHistory([]);
      });

    return () => controller.abort();
  }, [leaf.id, leaf.isOther]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4 py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaf-dialog-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="leaf-dialog-title"
              className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
            >
              {leaf.name}
            </h3>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {leaf.isOther ? "Products below 0.1% cash flow share" : leaf.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Close
          </button>
        </div>

        {leaf.isOther ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Products" value={leaf.otherProductCount.toLocaleString()} />
            <Metric label="Share of market" value={formatPct(leaf.sharePct)} />
            <Metric
              label="Weekly cash flow"
              value={`${formatVolume(leaf.weeklyCashFlow)} coins`}
            />
            <Metric label="Weekly volume" value={formatVolume(leaf.weeklyVolume)} />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Instant buy" value={`${formatCoins(leaf.buyPrice)} coins`} />
            <Metric label="Instant sell" value={`${formatCoins(leaf.sellPrice)} coins`} />
            <Metric label="Spread" value={`${formatCoins(leaf.spread)} coins`} />
            <Metric label="Spread %" value={formatPct(leaf.spreadPct)} />
            <Metric
              label="Weekly cash flow"
              value={`${formatVolume(leaf.weeklyCashFlow)} coins`}
            />
            <Metric label="Share of market" value={formatPct(leaf.sharePct)} />
            <Metric label="Weekly buy volume" value={formatVolume(leaf.buyMovingWeek)} />
            <Metric label="Weekly sell volume" value={formatVolume(leaf.sellMovingWeek)} />
            <Metric label="Buy orders" value={leaf.buyOrders.toLocaleString()} />
            <Metric label="Sell orders" value={leaf.sellOrders.toLocaleString()} />
            <Metric label="Buy volume" value={formatVolume(leaf.buyVolume)} />
            <Metric label="Sell volume" value={formatVolume(leaf.sellVolume)} />
          </div>
        )}

        {!leaf.isOther ? (
          <div className="mt-6 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Instant buy / sell
              </h4>
              {history === null ? (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Loading price history…
                </p>
              ) : (
                <div className="mt-2">
                  <TimeSeriesChart
                    data={history}
                    format="coins"
                    heightClassName="h-56"
                    series={[
                      { dataKey: "buyPrice", name: "Instant buy", color: "#059669" },
                      { dataKey: "sellPrice", name: "Instant sell", color: "#0f766e" },
                    ]}
                  />
                </div>
              )}
            </div>
            {history && history.length >= 2 ? (
              <div>
                <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  Spread %
                </h4>
                <div className="mt-2">
                  <TimeSeriesChart
                    data={history}
                    format="percent"
                    heightClassName="h-44"
                    series={[
                      { dataKey: "spreadPct", name: "Spread %", color: "#a1a1aa" },
                    ]}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CashFlowTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TooltipPayload; name?: string; value?: number }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const leaf = payload[0].payload ?? {};
  const name = leaf.name ?? payload[0].name ?? "Product";
  const coins = leaf.value ?? payload[0].value ?? 0;
  const sharePct = typeof leaf.sharePct === "number" ? leaf.sharePct : 0;

  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-none dark:border-zinc-700 dark:bg-zinc-900">
      <p className="font-semibold text-zinc-950 dark:text-zinc-50">{name}</p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-300">
        {formatVolume(coins)} coins · {formatPct(sharePct)}
      </p>
    </div>
  );
}

type CashFlowTreemapProps = {
  data: CashFlowLeaf[];
};

function cellFill(sharePct: number, isOther: boolean) {
  if (isOther) {
    return "#a1a1aa";
  }
  if (sharePct >= 0.08) {
    return "#064e3b";
  }
  if (sharePct >= 0.04) {
    return "#047857";
  }
  if (sharePct >= 0.02) {
    return "#059669";
  }
  return "#34d399";
}

function cellTextFill(sharePct: number, isOther: boolean) {
  return isOther || sharePct < 0.02 ? "#18181b" : "#fafafa";
}

function fontSizeForCell(name: string, width: number, height: number) {
  const pad = Math.min(8, Math.max(2, Math.min(width, height) * 0.08));
  const innerW = Math.max(1, width - pad * 2);
  const innerH = Math.max(1, height - pad * 2);
  const maxSize = Math.min(13, innerH / 2.2);
  const minSize = 5;

  for (let size = maxSize; size >= minSize; size -= 0.5) {
    const charsPerLine = Math.max(1, Math.floor(innerW / (size * 0.62)));
    const nameLines = Math.ceil(name.length / charsPerLine);
    const neededHeight = (nameLines + 1) * size * 1.2;
    if (neededHeight <= innerH) {
      return { size, pad };
    }
  }

  return { size: minSize, pad };
}

function CashFlowCell(node: TreemapNode) {
  const { x, y, width, height, name } = node;
  if (width <= 0 || height <= 0) {
    return <g />;
  }

  const sharePct = typeof node.sharePct === "number" ? node.sharePct : 0;
  const isOther = node.isOther === true;
  const fill = cellFill(sharePct, isOther);
  const textFill = cellTextFill(sharePct, isOther);
  const { size, pad } = fontSizeForCell(name, width, height);
  const labelWidth = Math.max(0, width - 2);
  const labelHeight = Math.max(0, height - 2);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={1}
        style={{ cursor: "pointer" }}
      />
      {labelWidth > 8 && labelHeight > 8 ? (
        <foreignObject
          x={x + 1}
          y={y + 1}
          width={labelWidth}
          height={labelHeight}
          pointerEvents="none"
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              padding: pad,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              overflow: "hidden",
              color: textFill,
              fontSize: size,
              fontWeight: 600,
              lineHeight: 1.2,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            <div>{name}</div>
            <div style={{ fontWeight: 500 }}>{formatPct(sharePct)}</div>
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

export function CashFlowTreemap({ data }: CashFlowTreemapProps) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<CashFlowLeaf | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[42rem] w-full md:h-[48rem]" aria-hidden />;
  }

  return (
    <>
      <div className="h-[42rem] w-full cursor-pointer md:h-[48rem]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            nameKey="name"
            content={CashFlowCell}
            isAnimationActive={false}
            nodeGap={2}
            onClick={(node) => {
              const id = typeof node.id === "string" ? node.id : undefined;
              const name = node.name;
              const leaf =
                data.find((item) => item.id === id) ??
                data.find((item) => item.name === name);
              if (leaf) {
                setSelected(leaf);
              }
            }}
          >
            <Tooltip content={<CashFlowTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
      {selected ? (
        <LeafDialog leaf={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

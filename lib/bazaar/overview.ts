import { formatProductId } from "@/lib/bazaar/format";
import type { Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const TOP_N = 15;
export const SPREAD_VOLUME_FLOOR = 10_000;
export const CASH_FLOW_SHARE_FLOOR = 0.001;

export type OverviewRow = {
  id: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPct: number;
  weeklyVolume: number;
  weeklyCashFlow: number;
  buyVolume: number;
  sellVolume: number;
  buyMovingWeek: number;
  sellMovingWeek: number;
  buyOrders: number;
  sellOrders: number;
};

export type CashFlowLeaf = {
  id: string;
  name: string;
  value: number;
  sharePct: number;
  isOther: boolean;
  otherProductCount: number;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPct: number;
  weeklyVolume: number;
  weeklyCashFlow: number;
  buyVolume: number;
  sellVolume: number;
  buyMovingWeek: number;
  sellMovingWeek: number;
  buyOrders: number;
  sellOrders: number;
};

export type BazaarOverview = {
  productCount: number;
  lastObservedAt: string | null;
  lastIngestStatus: string | null;
  lastIngestFinishedAt: string | null;
  totalWeeklyVolume: number;
  totalWeeklyCashFlow: number;
  topLiquid: OverviewRow[];
  topSpreads: OverviewRow[];
  cashFlowLeaves: CashFlowLeaf[];
};

function toRow(product: Product): OverviewRow {
  const buyPrice = Number(product.buyPrice);
  const sellPrice = Number(product.sellPrice);
  const buyMovingWeek = Number(product.buyMovingWeek);
  const sellMovingWeek = Number(product.sellMovingWeek);
  const weeklyVolume = buyMovingWeek + sellMovingWeek;
  const weeklyCashFlow = buyMovingWeek * buyPrice + sellMovingWeek * sellPrice;
  const spread = buyPrice - sellPrice;

  return {
    id: product.id,
    buyPrice,
    sellPrice,
    spread,
    spreadPct: buyPrice > 0 ? spread / buyPrice : 0,
    weeklyVolume,
    weeklyCashFlow,
    buyVolume: Number(product.buyVolume),
    sellVolume: Number(product.sellVolume),
    buyMovingWeek,
    sellMovingWeek,
    buyOrders: product.buyOrders,
    sellOrders: product.sellOrders,
  };
}

function toCashFlowLeaves(rows: OverviewRow[], totalWeeklyCashFlow: number): CashFlowLeaf[] {
  if (totalWeeklyCashFlow <= 0) {
    return [];
  }

  const ranked = [...rows]
    .filter((row) => row.weeklyCashFlow > 0)
    .sort((a, b) => b.weeklyCashFlow - a.weeklyCashFlow)
    .map((row) => ({
      ...row,
      sharePct: row.weeklyCashFlow / totalWeeklyCashFlow,
    }));

  const visible = ranked.filter((row) => row.sharePct > CASH_FLOW_SHARE_FLOOR);
  const rest = ranked.filter((row) => row.sharePct <= CASH_FLOW_SHARE_FLOOR);
  const restCashFlow = rest.reduce((sum, row) => sum + row.weeklyCashFlow, 0);
  const restWeeklyVolume = rest.reduce((sum, row) => sum + row.weeklyVolume, 0);

  const leaves: CashFlowLeaf[] = visible.map((row) => ({
    id: row.id,
    name: formatProductId(row.id),
    value: row.weeklyCashFlow,
    sharePct: row.sharePct,
    isOther: false,
    otherProductCount: 0,
    buyPrice: row.buyPrice,
    sellPrice: row.sellPrice,
    spread: row.spread,
    spreadPct: row.spreadPct,
    weeklyVolume: row.weeklyVolume,
    weeklyCashFlow: row.weeklyCashFlow,
    buyVolume: row.buyVolume,
    sellVolume: row.sellVolume,
    buyMovingWeek: row.buyMovingWeek,
    sellMovingWeek: row.sellMovingWeek,
    buyOrders: row.buyOrders,
    sellOrders: row.sellOrders,
  }));

  if (restCashFlow > 0) {
    leaves.push({
      id: "OTHER",
      name: "Other",
      value: restCashFlow,
      sharePct: restCashFlow / totalWeeklyCashFlow,
      isOther: true,
      otherProductCount: rest.length,
      buyPrice: 0,
      sellPrice: 0,
      spread: 0,
      spreadPct: 0,
      weeklyVolume: restWeeklyVolume,
      weeklyCashFlow: restCashFlow,
      buyVolume: 0,
      sellVolume: 0,
      buyMovingWeek: 0,
      sellMovingWeek: 0,
      buyOrders: 0,
      sellOrders: 0,
    });
  }

  return leaves;
}

export async function getBazaarOverview(): Promise<BazaarOverview> {
  const [products, lastIngest] = await Promise.all([
    prisma.product.findMany(),
    prisma.ingestRun.findFirst({
      orderBy: { startedAt: "desc" },
      select: {
        status: true,
        finishedAt: true,
      },
    }),
  ]);

  const rows = products.map(toRow);
  const lastObservedAt = products.reduce<Date | null>((latest, product) => {
    if (!latest || product.lastObservedAt > latest) {
      return product.lastObservedAt;
    }
    return latest;
  }, null);

  const topLiquid = [...rows]
    .sort((a, b) => b.weeklyVolume - a.weeklyVolume)
    .slice(0, TOP_N);

  const topSpreads = rows
    .filter(
      (row) =>
        row.buyPrice > 0 &&
        row.sellPrice > 0 &&
        row.weeklyVolume >= SPREAD_VOLUME_FLOOR,
    )
    .sort((a, b) => b.spreadPct - a.spreadPct)
    .slice(0, TOP_N);

  const totalWeeklyVolume = rows.reduce((sum, row) => sum + row.weeklyVolume, 0);
  const totalWeeklyCashFlow = rows.reduce((sum, row) => sum + row.weeklyCashFlow, 0);

  return {
    productCount: products.length,
    lastObservedAt: lastObservedAt?.toISOString() ?? null,
    lastIngestStatus: lastIngest?.status ?? null,
    lastIngestFinishedAt: lastIngest?.finishedAt?.toISOString() ?? null,
    totalWeeklyVolume,
    totalWeeklyCashFlow,
    topLiquid,
    topSpreads,
    cashFlowLeaves: toCashFlowLeaves(rows, totalWeeklyCashFlow),
  };
}

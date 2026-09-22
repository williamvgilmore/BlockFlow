import { Prisma } from "@prisma/client";
import { formatProductId } from "@/lib/bazaar/format";
import { prisma } from "@/lib/prisma";
import { SPREAD_VOLUME_FLOOR } from "@/lib/bazaar/overview";

const MOVER_COUNT = 8;
const MAX_SERIES_POINTS = 360;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ProductHistoryPoint = {
  observedAt: string;
  buyPrice: number;
  sellPrice: number;
  spreadPct: number;
};

export type MoverRow = {
  id: string;
  name: string;
  buyPrice: number;
  previousBuyPrice: number;
  changePct: number;
  weeklyVolume: number;
};

export type CashFlowPoint = {
  observedAt: string;
  cashFlow: number;
};

export type MarketHistory = {
  moversWindowLabel: string;
  gainers: MoverRow[];
  losers: MoverRow[];
  cashFlowSeries: CashFlowPoint[];
};

function toNum(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string") {
    return Number(value);
  }
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }
  return Number(value);
}

function downsample<T>(points: T[], max = MAX_SERIES_POINTS): T[] {
  if (points.length <= max) {
    return points;
  }

  const step = Math.ceil(points.length / max);
  return points.filter(
    (_, index) => index % step === 0 || index === points.length - 1,
  );
}

export async function getProductHistory(
  productId: string,
): Promise<ProductHistoryPoint[]> {
  const rows = await prisma.productSnapshot.findMany({
    where: { productId },
    orderBy: { observedAt: "asc" },
    select: {
      observedAt: true,
      buyPrice: true,
      sellPrice: true,
    },
  });

  return downsample(rows).map((row) => {
    const buyPrice = Number(row.buyPrice);
    const sellPrice = Number(row.sellPrice);
    return {
      observedAt: row.observedAt.toISOString(),
      buyPrice,
      sellPrice,
      spreadPct: buyPrice > 0 ? (buyPrice - sellPrice) / buyPrice : 0,
    };
  });
}

export async function getMarketHistory(): Promise<MarketHistory> {
  const [bounds, products, cashFlowRows] = await Promise.all([
    prisma.productSnapshot.aggregate({
      _min: { observedAt: true },
      _max: { observedAt: true },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        buyPrice: true,
        buyMovingWeek: true,
        sellMovingWeek: true,
      },
    }),
    prisma.$queryRaw<Array<{ observedAt: Date; cashFlow: unknown }>>(
      Prisma.sql`
        SELECT
          "observedAt",
          SUM(
            ("buyMovingWeek")::numeric * "buyPrice"
            + ("sellMovingWeek")::numeric * "sellPrice"
          ) AS "cashFlow"
        FROM "ProductSnapshot"
        GROUP BY "observedAt"
        ORDER BY "observedAt" ASC
      `,
    ),
  ]);

  const oldest = bounds._min.observedAt;
  const newest = bounds._max.observedAt;
  const empty: MarketHistory = {
    moversWindowLabel: "last 24 hours",
    gainers: [],
    losers: [],
    cashFlowSeries: [],
  };

  if (!oldest || !newest) {
    return empty;
  }

  const hasFullDay = newest.getTime() - oldest.getTime() >= DAY_MS;
  const cutoff = hasFullDay ? new Date(newest.getTime() - DAY_MS) : oldest;
  const moversWindowLabel = hasFullDay
    ? "last 24 hours"
    : "since first snapshot";

  const baselines = await prisma.$queryRaw<
    Array<{ productId: string; buyPrice: unknown; observedAt: Date }>
  >(
    Prisma.sql`
      SELECT DISTINCT ON ("productId")
        "productId",
        "buyPrice",
        "observedAt"
      FROM "ProductSnapshot"
      WHERE "observedAt" <= ${cutoff}
      ORDER BY "productId", "observedAt" DESC
    `,
  );

  const previousBuy = new Map(
    baselines.map((row) => [row.productId, toNum(row.buyPrice)]),
  );

  const movers = products
    .map((product) => {
      const buyPrice = Number(product.buyPrice);
      const previousBuyPrice = previousBuy.get(product.id);
      const weeklyVolume =
        Number(product.buyMovingWeek) + Number(product.sellMovingWeek);

      if (
        previousBuyPrice === undefined ||
        previousBuyPrice <= 0 ||
        buyPrice <= 0 ||
        weeklyVolume < SPREAD_VOLUME_FLOOR
      ) {
        return null;
      }

      return {
        id: product.id,
        name: formatProductId(product.id),
        buyPrice,
        previousBuyPrice,
        changePct: (buyPrice - previousBuyPrice) / previousBuyPrice,
        weeklyVolume,
      };
    })
    .filter((row): row is MoverRow => row !== null);

  const gainers = [...movers]
    .filter((row) => row.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, MOVER_COUNT);

  const losers = [...movers]
    .filter((row) => row.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, MOVER_COUNT);

  return {
    moversWindowLabel,
    gainers,
    losers,
    cashFlowSeries: downsample(cashFlowRows).map((row) => ({
      observedAt: row.observedAt.toISOString(),
      cashFlow: toNum(row.cashFlow),
    })),
  };
}

import type { Prisma } from "@prisma/client";
import type { BazaarQuickStatus } from "@/types/product";

export type SnapshotQuote = {
  productId: string;
  observedAt: Date;
  buyPrice: number;
  sellPrice: number;
  buyVolume: number;
  sellVolume: number;
  buyMovingWeek: number;
  sellMovingWeek: number;
  buyOrders: number;
  sellOrders: number;
};

export function toSnapshotQuote(
  productId: string,
  observedAt: Date,
  status: BazaarQuickStatus,
): SnapshotQuote {
  return {
    productId,
    observedAt,
    buyPrice: status.buyPrice,
    sellPrice: status.sellPrice,
    buyVolume: status.buyVolume,
    sellVolume: status.sellVolume,
    buyMovingWeek: status.buyMovingWeek,
    sellMovingWeek: status.sellMovingWeek,
    buyOrders: status.buyOrders,
    sellOrders: status.sellOrders,
  };
}

export function toProductCreate(quote: SnapshotQuote): Prisma.ProductCreateInput {
  return {
    id: quote.productId,
    lastObservedAt: quote.observedAt,
    buyPrice: quote.buyPrice,
    sellPrice: quote.sellPrice,
    buyVolume: quote.buyVolume,
    sellVolume: quote.sellVolume,
    buyMovingWeek: quote.buyMovingWeek,
    sellMovingWeek: quote.sellMovingWeek,
    buyOrders: quote.buyOrders,
    sellOrders: quote.sellOrders,
  };
}

export function toSnapshotCreate(
  quote: SnapshotQuote,
): Prisma.ProductSnapshotCreateManyInput {
  return {
    productId: quote.productId,
    observedAt: quote.observedAt,
    buyPrice: quote.buyPrice,
    sellPrice: quote.sellPrice,
    buyVolume: quote.buyVolume,
    sellVolume: quote.sellVolume,
    buyMovingWeek: quote.buyMovingWeek,
    sellMovingWeek: quote.sellMovingWeek,
    buyOrders: quote.buyOrders,
    sellOrders: quote.sellOrders,
  };
}

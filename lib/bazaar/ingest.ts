import type { BazaarApiResponse } from "@/types/BazaarAPIResponse";
import { prisma } from "@/lib/prisma";
import {
  toProductCreate,
  toSnapshotCreate,
  toSnapshotQuote,
} from "@/lib/bazaar/map-product";

const HYPIXEL_BAZAAR_URL = "https://api.hypixel.net/v2/skyblock/bazaar";
const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const PRUNE_BATCH_SIZE = 10_000;
const UPSERT_BATCH_SIZE = 100;
const SNAPSHOT_BATCH_SIZE = 1_000;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function isBazaarApiResponse(value: unknown): value is BazaarApiResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Partial<BazaarApiResponse>;
  return (
    typeof data.success === "boolean" &&
    typeof data.lastUpdated === "number" &&
    typeof data.products === "object" &&
    data.products !== null
  );
}

async function pruneOldSnapshots() {
  const cutoff = new Date(Date.now() - RETENTION_MS);

  while (true) {
    const stale = await prisma.productSnapshot.findMany({
      where: { observedAt: { lt: cutoff } },
      select: { id: true },
      take: PRUNE_BATCH_SIZE,
    });

    if (stale.length === 0) {
      break;
    }

    await prisma.productSnapshot.deleteMany({
      where: { id: { in: stale.map((row) => row.id) } },
    });
  }
}

export async function ingestOnce() {
  const startedAt = new Date();

  try {
    const response = await fetch(HYPIXEL_BAZAAR_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data: unknown = await response.json();

    if (!response.ok || !isBazaarApiResponse(data) || !data.success) {
      await prisma.ingestRun.create({
        data: {
          startedAt,
          finishedAt: new Date(),
          status: "error",
          error: "Hypixel Bazaar API returned an unsuccessful response.",
        },
      });
      return { status: "error" as const };
    }

    const observedAt = new Date(data.lastUpdated);
    const lastSuccess = await prisma.ingestRun.findFirst({
      where: { status: "success" },
      orderBy: { startedAt: "desc" },
      select: { lastUpdated: true },
    });

    if (lastSuccess?.lastUpdated?.getTime() === observedAt.getTime()) {
      await prisma.ingestRun.create({
        data: {
          startedAt,
          finishedAt: new Date(),
          lastUpdated: observedAt,
          status: "skipped",
        },
      });
      return { status: "skipped" as const };
    }

    const quotes = Object.entries(data.products).flatMap(([key, product]) => {
      if (!product?.quick_status) {
        return [];
      }

      return [
        toSnapshotQuote(product.product_id || key, observedAt, product.quick_status),
      ];
    });

    for (const batch of chunk(quotes, UPSERT_BATCH_SIZE)) {
      await prisma.$transaction(
        batch.map((quote) => {
          const row = toProductCreate(quote);
          return prisma.product.upsert({
            where: { id: row.id },
            create: row,
            update: {
              lastObservedAt: row.lastObservedAt,
              buyPrice: row.buyPrice,
              sellPrice: row.sellPrice,
              buyVolume: row.buyVolume,
              sellVolume: row.sellVolume,
              buyMovingWeek: row.buyMovingWeek,
              sellMovingWeek: row.sellMovingWeek,
              buyOrders: row.buyOrders,
              sellOrders: row.sellOrders,
            },
          });
        }),
      );
    }

    for (const batch of chunk(quotes, SNAPSHOT_BATCH_SIZE)) {
      await prisma.productSnapshot.createMany({
        data: batch.map(toSnapshotCreate),
        skipDuplicates: true,
      });
    }

    await pruneOldSnapshots();

    await prisma.ingestRun.create({
      data: {
        startedAt,
        finishedAt: new Date(),
        lastUpdated: observedAt,
        productCount: quotes.length,
        status: "success",
      },
    });

    return { status: "success" as const, productCount: quotes.length };
  } catch (error) {
    await prisma.ingestRun.create({
      data: {
        startedAt,
        finishedAt: new Date(),
        status: "error",
        error: error instanceof Error ? error.message : "Unknown ingest error.",
      },
    });
    return { status: "error" as const };
  }
}

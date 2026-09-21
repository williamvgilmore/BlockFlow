import { ingestOnce } from "../lib/bazaar/ingest";
import { prisma } from "../lib/prisma";

const DEFAULT_INTERVAL_MS = 180_000;

function intervalMs() {
  const parsed = Number(process.env.INGEST_INTERVAL_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_MS;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const once = process.argv.includes("--once");
  const interval = intervalMs();

  if (!once) {
    console.log(`Bazaar ingest loop started (every ${interval}ms)`);
  }

  do {
    const result = await ingestOnce();
    if (result.status === "success") {
      console.log(`Ingested ${result.productCount} products`);
    } else {
      console.log(`Ingest ${result.status}`);
    }
    if (!once) {
      await sleep(interval);
    }
  } while (!once);

  if (once) {
    await prisma.$disconnect();
  }
}

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});

void main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

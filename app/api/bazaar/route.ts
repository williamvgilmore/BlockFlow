import { NextResponse } from "next/server";
import type { Product as ProductRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

function toApiProduct(row: ProductRow): Product {
  return {
    date: row.lastObservedAt,
    product_id: row.id,
    quick_status: {
      buyPrice: Number(row.buyPrice),
      sellPrice: Number(row.sellPrice),
      buyVolume: Number(row.buyVolume),
      sellVolume: Number(row.sellVolume),
      buyMovingWeek: Number(row.buyMovingWeek),
      sellMovingWeek: Number(row.sellMovingWeek),
      buyOrders: row.buyOrders,
      sellOrders: row.sellOrders,
    },
  };
}

export async function GET() {
  try {
    const rows = await prisma.product.findMany();
    const products = rows
      .map(toApiProduct)
      .sort((a, b) => a.quick_status.buyPrice - b.quick_status.buyPrice);

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to read Bazaar products from the database." },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";
import { getProductHistory } from "@/lib/bazaar/history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("productId")?.trim();

  if (!productId || productId === "OTHER") {
    return NextResponse.json(
      { error: "A productId query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const points = await getProductHistory(productId);
    return NextResponse.json(points, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to read product history." },
      { status: 502 },
    );
  }
}

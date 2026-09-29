import { NextResponse } from "next/server";
import { fetchMajorPrices } from "@/lib/crypto/coingecko";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`prices:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429 },
    );
  }

  try {
    const snapshot = await fetchMajorPrices();
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("prices route error", err);
    return NextResponse.json(
      {
        error: "Unable to fetch prices from CoinGecko.",
        updatedAt: new Date().toISOString(),
        source: "CoinGecko",
        sourceUrl: "https://www.coingecko.com/",
      },
      { status: 502 },
    );
  }
}

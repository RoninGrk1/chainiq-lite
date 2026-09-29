import { NextResponse } from "next/server";
import { convertAmount } from "@/lib/crypto/coingecko";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";
import { sanitizeFiat, sanitizeSymbol } from "@/lib/utils/validation";

export const runtime = "nodejs";

const SYMBOL_TO_ID: Record<string, string> = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  sol: "solana",
  solana: "solana",
  xrp: "ripple",
  ripple: "ripple",
  ada: "cardano",
  cardano: "cardano",
  doge: "dogecoin",
  dogecoin: "dogecoin",
};

export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`convert:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const fromRaw = sanitizeSymbol(searchParams.get("from") || "bitcoin");
  const toFiat = sanitizeFiat(searchParams.get("to") || "gbp") as
    | "usd"
    | "gbp"
    | "eur";
  const amount = Number(searchParams.get("amount") || "1");

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const fromId = SYMBOL_TO_ID[fromRaw] || fromRaw;

  try {
    const result = await convertAmount(fromId, toFiat, amount);
    return NextResponse.json(result);
  } catch (err) {
    console.error("convert route error", err);
    return NextResponse.json(
      { error: "Conversion failed. Check the asset id/symbol." },
      { status: 502 },
    );
  }
}

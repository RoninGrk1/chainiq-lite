import { NextResponse } from "next/server";
import { lookupEthTx } from "@/lib/crypto/etherscan";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";
import { isEthTxHash } from "@/lib/utils/validation";

export const runtime = "nodejs";

type Params = { params: Promise<{ hash: string }> };

export async function GET(request: Request, { params }: Params) {
  const ip = clientIp(request);
  const rl = rateLimit(`eth:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { hash } = await params;
  if (!isEthTxHash(hash)) {
    return NextResponse.json(
      { error: "Invalid transaction hash. Expected 0x + 64 hex chars." },
      { status: 400 },
    );
  }

  if (!process.env.ETHERSCAN_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ETHERSCAN_API_KEY is not configured. Add a free key from etherscan.io.",
        source: "Etherscan",
        sourceUrl: `https://etherscan.io/tx/${hash}`,
      },
      { status: 503 },
    );
  }

  try {
    const tx = await lookupEthTx(hash);
    return NextResponse.json(tx);
  } catch (err) {
    console.error("eth tx route error", err);
    return NextResponse.json(
      { error: "Etherscan lookup failed." },
      { status: 502 },
    );
  }
}

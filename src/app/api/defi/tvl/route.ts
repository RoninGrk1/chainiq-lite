import { NextResponse } from "next/server";
import { fetchGlobalTvl, fetchProtocol } from "@/lib/crypto/defillama";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";
import { sanitizeSymbol } from "@/lib/utils/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`tvl:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const protocol = searchParams.get("protocol");

  try {
    if (protocol) {
      const slug = sanitizeSymbol(protocol);
      if (!slug) {
        return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
      }
      const info = await fetchProtocol(slug);
      return NextResponse.json(info);
    }
    const snapshot = await fetchGlobalTvl(10);
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("tvl route error", err);
    return NextResponse.json(
      { error: "DefiLlama request failed." },
      { status: 502 },
    );
  }
}

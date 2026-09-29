/**
 * CoinGecko Demo API helpers (prices + conversion).
 * Optional COINGECKO_API_KEY for higher limits; demo works without it.
 */

const BASE = "https://api.coingecko.com/api/v3";

const MAJOR_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "ripple",
  "cardano",
  "dogecoin",
] as const;

export type PriceQuote = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceGbp: number;
  priceEur: number;
  change24h: number | null;
};

export type MarketsSnapshot = {
  prices: PriceQuote[];
  updatedAt: string;
  source: string;
  sourceUrl: string;
};

function headers(): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  if (process.env.COINGECKO_API_KEY) {
    h["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  }
  return h;
}

export async function fetchMajorPrices(): Promise<MarketsSnapshot> {
  const ids = MAJOR_IDS.join(",");
  const url =
    `${BASE}/coins/markets?vs_currency=usd&ids=${ids}` +
    `&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko markets error: ${res.status}`);
  }

  type CgMarket = {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number | null;
  };

  const usdList = (await res.json()) as CgMarket[];

  // Also fetch GBP and EUR simple prices for conversion display
  const simpleUrl =
    `${BASE}/simple/price?ids=${ids}&vs_currencies=gbp,eur&include_24hr_change=false`;
  const simpleRes = await fetch(simpleUrl, {
    headers: headers(),
    next: { revalidate: 60 },
  });
  const simple = simpleRes.ok
    ? ((await simpleRes.json()) as Record<
        string,
        { gbp?: number; eur?: number }
      >)
    : {};

  const prices: PriceQuote[] = usdList.map((c) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    priceUsd: c.current_price,
    priceGbp: simple[c.id]?.gbp ?? c.current_price,
    priceEur: simple[c.id]?.eur ?? c.current_price,
    change24h: c.price_change_percentage_24h,
  }));

  return {
    prices,
    updatedAt: new Date().toISOString(),
    source: "CoinGecko",
    sourceUrl: "https://www.coingecko.com/",
  };
}

export async function convertAmount(
  fromId: string,
  toFiat: "usd" | "gbp" | "eur",
  amount: number,
): Promise<{
  fromId: string;
  toFiat: string;
  amount: number;
  rate: number;
  result: number;
  updatedAt: string;
  source: string;
  sourceUrl: string;
}> {
  const url = `${BASE}/simple/price?ids=${encodeURIComponent(fromId)}&vs_currencies=${toFiat}`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`CoinGecko convert error: ${res.status}`);
  const data = (await res.json()) as Record<string, Record<string, number>>;
  const rate = data[fromId]?.[toFiat];
  if (typeof rate !== "number") {
    throw new Error(`No rate for ${fromId} → ${toFiat}`);
  }
  return {
    fromId,
    toFiat,
    amount,
    rate,
    result: amount * rate,
    updatedAt: new Date().toISOString(),
    source: "CoinGecko",
    sourceUrl: "https://www.coingecko.com/",
  };
}

export { MAJOR_IDS };

/**
 * DefiLlama API — TVL and protocol info (public, no key required).
 */

const BASE = "https://api.llama.fi";

export type TvlSnapshot = {
  totalTvlUsd: number | null;
  topProtocols: {
    name: string;
    tvl: number;
    category: string | null;
    url: string | null;
  }[];
  updatedAt: string;
  source: string;
  sourceUrl: string;
};

export type ProtocolInfo = {
  name: string;
  tvl: number | null;
  chainTvls: Record<string, number>;
  category: string | null;
  url: string | null;
  description: string | null;
  updatedAt: string;
  source: string;
  sourceUrl: string;
};

export async function fetchGlobalTvl(limit = 10): Promise<TvlSnapshot> {
  const res = await fetch(`${BASE}/protocols`, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`DefiLlama protocols error: ${res.status}`);

  type Proto = {
    name: string;
    tvl?: number;
    category?: string;
    url?: string;
  };
  const list = (await res.json()) as Proto[];
  const sorted = [...list]
    .filter((p) => typeof p.tvl === "number")
    .sort((a, b) => (b.tvl || 0) - (a.tvl || 0));

  const top = sorted.slice(0, limit).map((p) => ({
    name: p.name,
    tvl: p.tvl || 0,
    category: p.category ?? null,
    url: p.url ?? null,
  }));

  const totalTvlUsd = sorted.reduce((sum, p) => sum + (p.tvl || 0), 0);

  return {
    totalTvlUsd,
    topProtocols: top,
    updatedAt: new Date().toISOString(),
    source: "DefiLlama",
    sourceUrl: "https://defillama.com/",
  };
}

export async function fetchProtocol(slug: string): Promise<ProtocolInfo> {
  const res = await fetch(`${BASE}/protocol/${encodeURIComponent(slug)}`, {
    next: { revalidate: 120 },
  });
  if (!res.ok) throw new Error(`DefiLlama protocol error: ${res.status}`);

  const data = (await res.json()) as {
    name?: string;
    tvl?: number | { date: number; totalLiquidityUSD: number }[];
    currentChainTvls?: Record<string, number>;
    category?: string;
    url?: string;
    description?: string;
  };

  let tvl: number | null = null;
  if (typeof data.tvl === "number") tvl = data.tvl;
  else if (Array.isArray(data.tvl) && data.tvl.length) {
    tvl = data.tvl[data.tvl.length - 1]?.totalLiquidityUSD ?? null;
  }

  return {
    name: data.name || slug,
    tvl,
    chainTvls: data.currentChainTvls || {},
    category: data.category ?? null,
    url: data.url ?? null,
    description: data.description ?? null,
    updatedAt: new Date().toISOString(),
    source: "DefiLlama",
    sourceUrl: `https://defillama.com/protocol/${slug}`,
  };
}

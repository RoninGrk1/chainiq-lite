import { ConversionWidget } from "@/components/markets/ConversionWidget";
import { PriceCard } from "@/components/markets/PriceCard";
import { fetchMajorPrices } from "@/lib/crypto/coingecko";

export const metadata = {
  title: "Markets",
};

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  let snapshot: Awaited<ReturnType<typeof fetchMajorPrices>> | null = null;
  let error: string | null = null;

  try {
    snapshot = await fetchMajorPrices();
  } catch {
    error =
      "Could not load CoinGecko prices right now. Check connectivity or try again shortly.";
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">Markets</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Snapshot of major cryptocurrencies. Informational only — not a trading
          signal.
        </p>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {snapshot ? (
        <>
          <p className="mb-4 text-xs text-zinc-500">
            Source:{" "}
            <a
              href={snapshot.sourceUrl}
              className="underline hover:text-zinc-300"
              target="_blank"
              rel="noreferrer"
            >
              {snapshot.source}
            </a>{" "}
            · Last updated{" "}
            {new Date(snapshot.updatedAt).toLocaleString("en-GB")} · 24h change
            shown where available
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {snapshot.prices.map((p) => (
              <PriceCard
                key={p.id}
                symbol={p.symbol}
                name={p.name}
                priceUsd={p.priceUsd}
                priceGbp={p.priceGbp}
                change24h={p.change24h}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-8">
        <ConversionWidget />
      </div>
    </div>
  );
}

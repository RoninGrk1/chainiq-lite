type Props = {
  symbol: string;
  name: string;
  priceUsd: number;
  priceGbp: number;
  change24h: number | null;
};

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: n >= 100 ? 2 : 6,
  }).format(n);
}

export function PriceCard({
  symbol,
  name,
  priceUsd,
  priceGbp,
  change24h,
}: Props) {
  const up = (change24h ?? 0) >= 0;
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{symbol}</h3>
          <p className="text-xs text-zinc-500">{name}</p>
        </div>
        {change24h != null ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              up
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            }`}
          >
            {up ? "+" : ""}
            {change24h.toFixed(2)}%
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-lg font-semibold tracking-tight text-zinc-50">
        {fmt(priceUsd, "USD")}
      </p>
      <p className="text-xs text-zinc-400">{fmt(priceGbp, "GBP")}</p>
    </article>
  );
}

"use client";

import { FormEvent, useState } from "react";

const ASSETS = [
  { id: "bitcoin", label: "BTC" },
  { id: "ethereum", label: "ETH" },
  { id: "solana", label: "SOL" },
  { id: "ripple", label: "XRP" },
  { id: "cardano", label: "ADA" },
  { id: "dogecoin", label: "DOGE" },
] as const;

const FIATS = [
  { id: "gbp", label: "GBP" },
  { id: "usd", label: "USD" },
  { id: "eur", label: "EUR" },
] as const;

type Result = {
  amount: number;
  rate: number;
  result: number;
  toFiat: string;
  fromId: string;
  updatedAt: string;
  source: string;
  sourceUrl: string;
};

export function ConversionWidget() {
  const [from, setFrom] = useState("bitcoin");
  const [to, setTo] = useState("gbp");
  const [amount, setAmount] = useState("1");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        from,
        to,
        amount,
      });
      const res = await fetch(`/api/markets/convert?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Conversion failed");
        setResult(null);
        return;
      }
      setResult(data as Result);
    } catch {
      setError("Network error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Convert</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Indicative rates via CoinGecko. Not a quote for trading.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="conv-amount" className="text-xs text-zinc-400">
            Amount
          </label>
          <input
            id="conv-amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div>
          <label htmlFor="conv-from" className="text-xs text-zinc-400">
            Asset
          </label>
          <select
            id="conv-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {ASSETS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="conv-to" className="text-xs text-zinc-400">
            Fiat
          </label>
          <select
            id="conv-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {FIATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "…" : "Convert"}
          </button>
        </div>
      </form>
      {error ? (
        <p className="mt-3 text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="mt-4 rounded-xl bg-zinc-950/80 p-3 text-sm text-zinc-200">
          <p className="text-lg font-semibold text-emerald-300">
            {new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: result.toFiat.toUpperCase(),
              maximumFractionDigits: 2,
            }).format(result.result)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Rate: 1 {result.fromId} ={" "}
            {result.rate.toLocaleString("en-GB", { maximumFractionDigits: 6 })}{" "}
            {result.toFiat.toUpperCase()}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            Source:{" "}
            <a
              href={result.sourceUrl}
              className="underline hover:text-zinc-400"
              target="_blank"
              rel="noreferrer"
            >
              {result.source}
            </a>{" "}
            · Updated {new Date(result.updatedAt).toLocaleString("en-GB")}
          </p>
        </div>
      ) : null}
    </section>
  );
}

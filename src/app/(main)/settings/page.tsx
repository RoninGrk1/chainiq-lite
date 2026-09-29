export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">Settings &amp; privacy</h1>
        <p className="mt-1 text-sm text-zinc-400">
          ChainIQ Lite is read-only and educational. Preferences sync later via
          Supabase.
        </p>
      </header>

      <section className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Privacy</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
            <li>We never ask for private keys, seed phrases, or recovery mnemonics.</li>
            <li>No trading, custody, or transaction signing.</li>
            <li>API keys live only on the server (never in the browser bundle).</li>
            <li>Market data is informational and may be delayed.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Disclaimer</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Nothing in ChainIQ Lite is personalised investment advice. Crypto
            assets are volatile and you can lose money. Do your own research and
            seek regulated advice if needed.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Integrations</h2>
          <dl className="mt-3 space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between gap-4">
              <dt>AI</dt>
              <dd className="text-zinc-300">Cloudflare Workers AI</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Prices</dt>
              <dd className="text-zinc-300">CoinGecko</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Ethereum</dt>
              <dd className="text-zinc-300">Etherscan</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>DeFi TVL</dt>
              <dd className="text-zinc-300">DefiLlama</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Auth / DB</dt>
              <dd className="text-zinc-300">Supabase (stubbed)</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

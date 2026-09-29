/**
 * Cloudflare Workers AI client helper.
 * Keys stay server-side only (CF_ACCOUNT_ID, CF_API_TOKEN).
 * Default model: @cf/meta/llama-3.1-8b-instruct
 */

export const DEFAULT_CF_MODEL =
  process.env.CF_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";

export const SYSTEM_PROMPT = `You are ChainIQ Lite, a financial and blockchain educator.
Use UK English spelling and tone.
You explain crypto, blockchain, DeFi, and markets in clear, accessible language.

Rules you must always follow:
- Never give personalised investment advice. Do not tell users what to buy, sell, or hold.
- Market data is informational only and may be delayed. Always note that prices change.
- Never ask for, accept, or process private keys, seed phrases, recovery phrases, or mnemonics. If a user pastes one, refuse and warn them to revoke/move funds.
- Prefer citing sources (CoinGecko, Etherscan, DefiLlama, Cloudflare Workers AI) when data is used.
- Be concise, accurate, and educational. If unsure, say so.
- Read-only: you do not trade, custody wallets, or sign transactions.`;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function hasCloudflareCredentials(): boolean {
  return Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN);
}

export async function chatWithWorkersAI(
  messages: ChatMessage[],
): Promise<{ content: string; model: string; live: boolean }> {
  if (!hasCloudflareCredentials()) {
    return {
      content: offlineStubReply(messages),
      model: "offline-stub",
      live: false,
    };
  }

  const accountId = process.env.CF_ACCOUNT_ID!;
  const token = process.env.CF_API_TOKEN!;
  const model = DEFAULT_CF_MODEL;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const withSystem: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.filter((m) => m.role !== "system"),
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: withSystem }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Cloudflare Workers AI error", res.status, errText);
    return {
      content:
        "Live AI is temporarily unavailable. " +
        offlineStubReply(messages) +
        "\n\n_Source: offline fallback (Cloudflare Workers AI error)._",
      model: "offline-stub",
      live: false,
    };
  }

  const data = (await res.json()) as {
    result?: { response?: string };
    success?: boolean;
  };
  const content =
    data.result?.response?.trim() ||
    "I could not generate a reply just now. Please try again.";

  return { content, model, live: true };
}

function offlineStubReply(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const q = (lastUser?.content || "").toLowerCase();

  const glossary: Record<string, string> = {
    blockchain:
      "**Blockchain** is a distributed ledger: append-only blocks of transactions linked by cryptographic hashes, maintained by a network of nodes.",
    bitcoin:
      "**Bitcoin (BTC)** is the original cryptocurrency — a peer-to-peer electronic cash system using Proof of Work. Informational only; not advice.",
    ethereum:
      "**Ethereum (ETH)** is a smart-contract platform. Ether pays for computation (gas). Many tokens and DeFi apps run on it.",
    defi: "**DeFi** (decentralised finance) refers to on-chain protocols for lending, swapping, and earning yield without traditional intermediaries.",
    tvl: "**TVL** (Total Value Locked) estimates assets deposited in a DeFi protocol. Useful for scale, not a guarantee of safety.",
    gas: "**Gas** is the fee paid to execute Ethereum transactions, priced in gwei. It covers network computation and storage.",
    wallet:
      "A **wallet** holds keys that control on-chain assets. ChainIQ Lite never asks for seed phrases or private keys — never share them with any chatbot.",
  };

  for (const [key, answer] of Object.entries(glossary)) {
    if (q.includes(key)) {
      return (
        `${answer}\n\n` +
        `_Offline demo mode_ — Cloudflare Workers AI is not configured. ` +
        `Set \`CF_ACCOUNT_ID\` and \`CF_API_TOKEN\` for live answers. ` +
        `Market data still works via CoinGecko / DefiLlama / Etherscan when those keys (or public endpoints) are available.\n\n` +
        `_Disclaimer: informational only — not personalised investment advice._`
      );
    }
  }

  return (
    `I'm **ChainIQ Lite** running in **offline demo mode** (no Cloudflare Workers AI credentials).\n\n` +
    `I can still help with common terms (try: blockchain, Bitcoin, Ethereum, DeFi, TVL, gas, wallet) and the Markets page shows live-ish prices from CoinGecko when reachable.\n\n` +
    `**To enable live AI:** set \`CF_ACCOUNT_ID\`, \`CF_API_TOKEN\`, and optionally \`CF_AI_MODEL\` (default \`@cf/meta/llama-3.1-8b-instruct\`) in \`.env.local\`.\n\n` +
    `You asked: “${(lastUser?.content || "").slice(0, 200)}”\n\n` +
    `_Disclaimer: informational only — not personalised investment advice. Never share seed phrases or private keys._`
  );
}

/**
 * Etherscan public ETH transaction lookup.
 * Requires ETHERSCAN_API_KEY for reliable access (free tier available).
 */

export type EthTxSummary = {
  hash: string;
  blockNumber: string | null;
  from: string | null;
  to: string | null;
  valueWei: string | null;
  valueEth: number | null;
  gasUsed: string | null;
  isError: boolean | null;
  timestamp: string | null;
  status: string;
  source: string;
  sourceUrl: string;
};

export async function lookupEthTx(hash: string): Promise<EthTxSummary> {
  const apiKey = process.env.ETHERSCAN_API_KEY || "";
  const url =
    `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash` +
    `&txhash=${encodeURIComponent(hash)}&apikey=${apiKey}`;

  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Etherscan error: ${res.status}`);

  const data = (await res.json()) as {
    result?: {
      hash?: string;
      blockNumber?: string;
      from?: string;
      to?: string;
      value?: string;
      gas?: string;
    } | null;
    message?: string;
  };

  const tx = data.result;
  if (!tx || !tx.hash) {
    // Try receipt for status
    return {
      hash,
      blockNumber: null,
      from: null,
      to: null,
      valueWei: null,
      valueEth: null,
      gasUsed: null,
      isError: null,
      timestamp: null,
      status: "not_found",
      source: "Etherscan",
      sourceUrl: `https://etherscan.io/tx/${hash}`,
    };
  }

  const valueWei = tx.value ?? null;
  let valueEth: number | null = null;
  if (valueWei) {
    try {
      valueEth = Number(BigInt(valueWei)) / 1e18;
    } catch {
      valueEth = null;
    }
  }

  return {
    hash: tx.hash,
    blockNumber: tx.blockNumber ? String(parseInt(tx.blockNumber, 16)) : null,
    from: tx.from ?? null,
    to: tx.to ?? null,
    valueWei,
    valueEth,
    gasUsed: tx.gas ? String(parseInt(tx.gas, 16)) : null,
    isError: null,
    timestamp: new Date().toISOString(),
    status: tx.blockNumber ? "mined" : "pending",
    source: "Etherscan",
    sourceUrl: `https://etherscan.io/tx/${hash}`,
  };
}

const ETH_TX_HASH = /^0x[a-fA-F0-9]{64}$/;
const SAFE_TEXT = /^[\s\S]{1,4000}$/;

export function isEthTxHash(value: string): boolean {
  return ETH_TX_HASH.test(value);
}

export function isSafeChatMessage(value: unknown): value is string {
  return typeof value === "string" && SAFE_TEXT.test(value.trim());
}

export function sanitizeSymbol(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
}

export function sanitizeFiat(value: string): string {
  const v = value.trim().toLowerCase();
  if (["gbp", "usd", "eur"].includes(v)) return v;
  return "usd";
}

/** Refuse messages that look like seed phrases / private keys. */
export function looksLikeSecret(text: string): boolean {
  const lower = text.toLowerCase();
  if (
    /private\s*key|seed\s*phrase|recovery\s*phrase|mnemonic|secret\s*key/.test(
      lower,
    )
  ) {
    return true;
  }
  // Rough BIP39-ish: 12 or 24 space-separated lowercase words
  const words = text.trim().split(/\s+/);
  if (
    (words.length === 12 || words.length === 24) &&
    words.every((w) => /^[a-z]+$/i.test(w) && w.length <= 12)
  ) {
    return true;
  }
  // Raw hex private key without 0x (tx hashes are 0x-prefixed and handled elsewhere)
  if (/^[a-fA-F0-9]{64}$/.test(text.trim())) {
    return true;
  }
  return false;
}

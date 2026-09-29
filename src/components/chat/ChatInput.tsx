"use client";

import { FormEvent, useState } from "react";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-zinc-800 bg-zinc-950/80 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:p-4"
    >
      <label htmlFor="chat-input" className="sr-only">
        Message ChainIQ Lite
      </label>
      <div className="mx-auto flex max-w-3xl gap-2">
        <input
          id="chat-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          maxLength={4000}
          placeholder="Ask about crypto, DeFi, Ethereum…"
          autoComplete="off"
          className="min-h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-[10px] text-zinc-600">
        Never paste private keys or seed phrases. Data is informational only.
      </p>
    </form>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

type Props = {
  messages: UiMessage[];
  busy?: boolean;
};

export function MessageList({ messages, busy }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  if (!messages.length && !busy) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          ChainIQ Lite
        </div>
        <h1 className="text-xl font-semibold text-zinc-100">
          Ask about blockchain &amp; markets
        </h1>
        <p className="max-w-md text-sm text-zinc-400">
          Educational answers in UK English. No personalised advice, no wallet
          keys, no trading. Try “What is DeFi?” or “Explain gas fees”.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 md:px-6">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          role={m.role}
          content={m.content}
          meta={m.meta}
        />
      ))}
      {busy ? (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
            Thinking…
          </div>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}

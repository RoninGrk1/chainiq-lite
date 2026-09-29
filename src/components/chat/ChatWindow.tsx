"use client";

import { useCallback, useState } from "react";
import { ChatInput } from "./ChatInput";
import { MessageList, type UiMessage } from "./MessageList";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatWindow() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [busy, setBusy] = useState(false);

  const onSend = useCallback(
    async (text: string) => {
      const userMsg: UiMessage = { id: uid(), role: "user", content: text };
      const next = [...messages, userMsg];
      setMessages(next);
      setBusy(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });
        const data = (await res.json()) as {
          content?: string;
          error?: string;
          model?: string;
          live?: boolean;
          timestamp?: string;
          sources?: { name: string; url: string }[];
        };

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: data.error || "Something went wrong.",
              meta: new Date().toLocaleString("en-GB"),
            },
          ]);
          return;
        }

        const sourceBits =
          data.sources?.map((s) => s.name).join(", ") ||
          (data.live ? "Cloudflare Workers AI" : "offline stub");
        const ts = data.timestamp
          ? new Date(data.timestamp).toLocaleString("en-GB")
          : new Date().toLocaleString("en-GB");

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: data.content || "No reply.",
            meta: `${sourceBits} · ${ts}${data.model ? ` · ${data.model}` : ""}`,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: "Network error — please try again.",
            meta: new Date().toLocaleString("en-GB"),
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [messages],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <MessageList messages={messages} busy={busy} />
      <ChatInput onSend={onSend} disabled={busy} />
    </div>
  );
}

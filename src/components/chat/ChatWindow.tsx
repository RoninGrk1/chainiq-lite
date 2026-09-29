"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  appendChatMessage,
  ensureChatSession,
  loadSessionMessages,
} from "@/lib/chat/persist";
import { ChatInput } from "./ChatInput";
import { MessageList, type UiMessage } from "./MessageList";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatWindow() {
  const { user, configured } = useAuth();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(Boolean(sessionParam));
  const [persistNote, setPersistNote] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!sessionParam || !user) {
      setLoadingSession(false);
      if (!sessionParam) {
        // New guest / empty chat — keep local state unless opening a session
      }
      return;
    }

    let cancelled = false;
    loadingRef.current = true;
    setLoadingSession(true);

    void (async () => {
      const result = await loadSessionMessages(sessionParam, user.id);
      if (cancelled) return;
      if (result.error || !result.session) {
        setPersistNote(result.error || "Could not load session.");
        setLoadingSession(false);
        loadingRef.current = false;
        return;
      }
      setSessionId(result.session.id);
      setMessages(
        result.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            meta: new Date(m.created_at).toLocaleString("en-GB"),
          })),
      );
      setLoadingSession(false);
      loadingRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionParam, user]);

  // Clear local session when user signs out (unless URL still has session)
  useEffect(() => {
    if (!user && !sessionParam) {
      setSessionId(null);
    }
  }, [user, sessionParam]);

  const persistPair = useCallback(
    async (
      userText: string,
      assistantText: string,
      sources: { name: string; url: string }[] | undefined,
    ) => {
      if (!user || !configured) return;

      const ensured = await ensureChatSession(
        user.id,
        sessionId,
        userText,
      );
      if (ensured.error || !ensured.sessionId) {
        setPersistNote(
          ensured.error
            ? `Could not save chat: ${ensured.error}`
            : "Could not save chat.",
        );
        return;
      }

      if (ensured.sessionId !== sessionId) {
        setSessionId(ensured.sessionId);
        // Soft-update URL without full navigation
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("session", ensured.sessionId);
          window.history.replaceState({}, "", url.toString());
        }
      }

      const userRes = await appendChatMessage(ensured.sessionId, {
        role: "user",
        content: userText,
      });
      if (userRes.error) {
        setPersistNote(`Could not save message: ${userRes.error}`);
        return;
      }

      const asstRes = await appendChatMessage(ensured.sessionId, {
        role: "assistant",
        content: assistantText,
        sources: sources ?? null,
      });
      if (asstRes.error) {
        setPersistNote(`Could not save reply: ${asstRes.error}`);
        return;
      }
      setPersistNote(null);
    },
    [configured, sessionId, user],
  );

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
          const errContent = data.error || "Something went wrong.";
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: errContent,
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
        const assistantContent = data.content || "No reply.";

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: assistantContent,
            meta: `${sourceBits} · ${ts}${data.model ? ` · ${data.model}` : ""}`,
          },
        ]);

        void persistPair(text, assistantContent, data.sources);
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
    [messages, persistPair],
  );

  const startNew = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setPersistNote(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("session");
      window.history.replaceState({}, "", url.pathname);
    }
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-900/80 px-4 py-1.5 md:px-6">
        <p className="truncate text-[11px] text-zinc-500">
          {user
            ? sessionId
              ? "Saving to your history"
              : "Signed in — chats will be saved"
            : configured
              ? "Guest mode — sign in via Settings to save history"
              : "Guest mode — configure Supabase to enable saved history"}
        </p>
        {(messages.length > 0 || sessionId) && (
          <button
            type="button"
            onClick={startNew}
            className="shrink-0 rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          >
            New chat
          </button>
        )}
      </div>
      {persistNote ? (
        <p className="px-4 py-1 text-[11px] text-amber-400 md:px-6" role="status">
          {persistNote}
        </p>
      ) : null}
      {loadingSession ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          Loading conversation…
        </div>
      ) : (
        <>
          <MessageList messages={messages} busy={busy} />
          <ChatInput onSend={onSend} disabled={busy} />
        </>
      )}
    </div>
  );
}

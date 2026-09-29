"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { deleteChatSession, listChatSessions } from "@/lib/chat/persist";

type SessionRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export function HistoryClient() {
  const { configured, loading, user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSessions([]);
      return;
    }
    setFetching(true);
    setError(null);
    const result = await listChatSessions(user.id);
    if (result.error) setError(result.error);
    setSessions(result.data as SessionRow[]);
    setFetching(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onDelete(id: string) {
    if (!user) return;
    if (!window.confirm("Delete this conversation?")) return;
    const res = await deleteChatSession(id, user.id);
    if (res.error) setError(res.error);
    else void refresh();
  }

  if (!configured) {
    return (
      <div className="space-y-4">
        <AuthPanel />
      </div>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">Checking session…</p>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-center">
          <p className="text-sm font-medium text-zinc-200">
            Sign in to view saved history
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Guest chats stay on this device only and are not listed here.
          </p>
        </div>
        <AuthPanel />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          Signed in as {user.email ?? user.id}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-900"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-900/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {fetching && !sessions.length ? (
        <p className="text-sm text-zinc-500">Loading sessions…</p>
      ) : null}

      {!fetching && !sessions.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center">
          <p className="text-sm font-medium text-zinc-200">No saved sessions yet</p>
          <p className="mt-2 text-xs text-zinc-500">
            Start a chat while signed in — it will appear here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-emerald-400 hover:underline"
          >
            Open chat
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3"
            >
              <Link
                href={`/?session=${s.id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium text-zinc-100">
                  {s.title || "Untitled"}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Updated {new Date(s.updated_at).toLocaleString("en-GB")}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => void onDelete(s.id)}
                className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:border-rose-800 hover:text-rose-300"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

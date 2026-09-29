"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "./AuthProvider";

type Mode = "signin" | "signup" | "magic";

export function AuthPanel() {
  const {
    configured,
    loading,
    user,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/30 p-4">
        <h2 className="text-sm font-semibold text-amber-200">
          Configure Supabase
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
          Set{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-[11px]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-[11px]">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          in{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-[11px]">
            .env.local
          </code>
          , then apply{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-[11px]">
            supabase/migrations/001_init.sql
          </code>{" "}
          in your ChainIQ Lite Supabase project. Guest chat still works without
          auth.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
        Checking session…
      </div>
    );
  }

  if (user) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Account</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Signed in as{" "}
          <span className="text-zinc-200">{user.email ?? user.id}</span>
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "magic") {
        const res = await signInWithMagicLink(email.trim());
        if (res.error) setError(res.error);
        else
          setMessage(
            "Check your email for the magic link (enable Email auth in Supabase).",
          );
        return;
      }

      if (mode === "signup") {
        const res = await signUpWithPassword(email.trim(), password);
        if (res.error) setError(res.error);
        else if (res.needsConfirm)
          setMessage(
            "Account created — confirm your email if required, then sign in.",
          );
        else setMessage("Account created. You are signed in.");
        return;
      }

      const res = await signInWithPassword(email.trim(), password);
      if (res.error) setError(res.error);
      else setMessage("Signed in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Sign in</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Save chat history and preferences. Guest chat works without an account.
      </p>

      <div className="mt-3 flex gap-1 rounded-lg bg-zinc-950 p-1 text-xs">
        {(
          [
            ["signin", "Sign in"],
            ["signup", "Sign up"],
            ["magic", "Magic link"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 rounded-md px-2 py-1.5 transition ${
              mode === id
                ? "bg-emerald-500/20 text-emerald-300"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-xs text-zinc-400">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
        </label>

        {mode !== "magic" ? (
          <label className="block text-xs text-zinc-400">
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
        ) : null}

        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-400" role="status">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy
            ? "Please wait…"
            : mode === "magic"
              ? "Send magic link"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { PreferredFiat, ThemePreference } from "@/lib/supabase/types";

export function PreferencesForm() {
  const { user, preferences, updatePreferences, configured } = useAuth();
  const [fiat, setFiat] = useState<PreferredFiat>("gbp");
  const [theme, setTheme] = useState<ThemePreference>("dark");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) {
      setFiat(preferences.preferred_fiat);
      setTheme(preferences.theme);
    }
  }, [preferences]);

  if (!configured || !user) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Preferences</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to sync theme and default fiat currency across devices.
        </p>
      </div>
    );
  }

  async function onSave() {
    setBusy(true);
    setStatus(null);
    const res = await updatePreferences({
      preferred_fiat: fiat,
      theme,
    });
    setBusy(false);
    setStatus(res.error ? res.error : "Preferences saved.");
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Preferences</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Stored in Supabase <code className="text-[10px]">user_preferences</code>.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-zinc-400">
          Default fiat
          <select
            value={fiat}
            onChange={(e) => setFiat(e.target.value as PreferredFiat)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="gbp">GBP (£)</option>
            <option value="usd">USD ($)</option>
            <option value="eur">EUR (€)</option>
          </select>
        </label>

        <label className="block text-xs text-zinc-400">
          Theme
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemePreference)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onSave()}
        className="mt-4 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save preferences"}
      </button>

      {status ? (
        <p
          className={`mt-2 text-sm ${
            status.includes("saved") ? "text-emerald-400" : "text-rose-400"
          }`}
          role="status"
        >
          {status}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] text-zinc-600">
        Theme preference is saved for later UI theming; the app currently ships
        with a dark shell.
      </p>
    </div>
  );
}

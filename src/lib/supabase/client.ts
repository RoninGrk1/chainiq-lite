"use client";

/**
 * Browser Supabase client (cookie-aware via @supabase/ssr).
 * Returns null when NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are unset.
 */
import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "./config";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserClient(): SupabaseClient<Database> | null {
  const env = getSupabaseEnv();
  if (!env) return null;

  if (!browserClient) {
    browserClient = createSSRBrowserClient<Database>(env.url, env.anonKey);
  }
  return browserClient;
}

export { isSupabaseConfigured };

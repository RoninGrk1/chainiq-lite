"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  createBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type {
  PreferredFiat,
  ThemePreference,
  UserPreferences,
} from "@/lib/supabase/types";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  preferences: UserPreferences | null;
  refreshPreferences: () => Promise<void>;
  updatePreferences: (patch: {
    preferred_fiat?: PreferredFiat;
    theme?: ThemePreference;
  }) => Promise<{ error: string | null }>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirm?: boolean }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const defaultPrefs = (
  userId: string,
): Omit<UserPreferences, "id" | "created_at" | "updated_at"> &
  Partial<Pick<UserPreferences, "id" | "created_at" | "updated_at">> => ({
  user_id: userId,
  preferred_fiat: "gbp",
  theme: "dark",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const loadPreferences = useCallback(async (userId: string) => {
    const supabase = createBrowserClient();
    if (!supabase) {
      setPreferences(null);
      return;
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("preferences load failed", error.message);
      setPreferences(null);
      return;
    }

    if (data) {
      setPreferences(data);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("user_preferences")
      .insert(defaultPrefs(userId))
      .select("*")
      .single();

    if (insertError) {
      console.warn("preferences insert failed", insertError.message);
      setPreferences(null);
      return;
    }
    setPreferences(inserted);
  }, []);

  const refreshPreferences = useCallback(async () => {
    if (!session?.user?.id) {
      setPreferences(null);
      return;
    }
    await loadPreferences(session.user.id);
  }, [loadPreferences, session?.user?.id]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
      if (data.session?.user?.id) {
        void loadPreferences(data.session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user?.id) {
        void loadPreferences(next.user.id);
      } else {
        setPreferences(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured, loadPreferences]);

  const updatePreferences = useCallback(
    async (patch: {
      preferred_fiat?: PreferredFiat;
      theme?: ThemePreference;
    }) => {
      const supabase = createBrowserClient();
      const userId = session?.user?.id;
      if (!supabase || !userId) {
        return { error: "Sign in to save preferences." };
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: userId,
            preferred_fiat: patch.preferred_fiat ?? preferences?.preferred_fiat ?? "gbp",
            theme: patch.theme ?? preferences?.theme ?? "dark",
          },
          { onConflict: "user_id" },
        )
        .select("*")
        .single();

      if (error) return { error: error.message };
      setPreferences(data);
      return { error: null };
    },
    [preferences?.preferred_fiat, preferences?.theme, session?.user?.id],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const supabase = createBrowserClient();
      if (!supabase) return { error: "Supabase is not configured." };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string) => {
      const supabase = createBrowserClient();
      if (!supabase) return { error: "Supabase is not configured." };
      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: origin
          ? { emailRedirectTo: `${origin}/auth/callback` }
          : undefined,
      });
      if (error) return { error: error.message };
      const needsConfirm = !data.session;
      return { error: null, needsConfirm };
    },
    [],
  );

  const signInWithMagicLink = useCallback(async (email: string) => {
    const supabase = createBrowserClient();
    if (!supabase) return { error: "Supabase is not configured." };
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setPreferences(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      preferences,
      refreshPreferences,
      updatePreferences,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      signOut,
    }),
    [
      configured,
      loading,
      session,
      preferences,
      refreshPreferences,
      updatePreferences,
      signInWithPassword,
      signUpWithPassword,
      signInWithMagicLink,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

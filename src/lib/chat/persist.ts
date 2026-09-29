"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";

export type PersistableMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: Json | null;
};

function titleFromContent(content: string): string {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}…` : cleaned;
}

/** Ensure a chat_sessions row exists for the signed-in user. */
export async function ensureChatSession(
  userId: string,
  sessionId: string | null,
  firstUserMessage?: string,
): Promise<{ sessionId: string | null; error: string | null }> {
  const supabase = createBrowserClient();
  if (!supabase) return { sessionId: null, error: "Supabase not configured" };

  if (sessionId) {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { sessionId: null, error: error.message };
    if (data) return { sessionId: data.id, error: null };
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      title: firstUserMessage
        ? titleFromContent(firstUserMessage)
        : "New chat",
    })
    .select("id")
    .single();

  if (error) return { sessionId: null, error: error.message };
  return { sessionId: data.id, error: null };
}

export async function appendChatMessage(
  sessionId: string,
  message: PersistableMessage,
): Promise<{ id: string | null; error: string | null }> {
  const supabase = createBrowserClient();
  if (!supabase) return { id: null, error: "Supabase not configured" };

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      sources: message.sources ?? null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  // Bump session updated_at / optionally refine title
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return { id: data.id, error: null };
}

export async function listChatSessions(userId: string) {
  const supabase = createBrowserClient();
  if (!supabase) return { data: [], error: "Supabase not configured" };

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  return { data: data ?? [], error: error?.message ?? null };
}

export async function loadSessionMessages(sessionId: string, userId: string) {
  const supabase = createBrowserClient();
  if (!supabase) return { session: null, messages: [], error: "Supabase not configured" };

  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at, user_id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionError) {
    return { session: null, messages: [], error: sessionError.message };
  }
  if (!session) {
    return { session: null, messages: [], error: "Session not found" };
  }

  const { data: messages, error: msgError } = await supabase
    .from("chat_messages")
    .select("id, role, content, sources, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (msgError) {
    return { session, messages: [], error: msgError.message };
  }

  return { session, messages: messages ?? [], error: null };
}

export async function deleteChatSession(sessionId: string, userId: string) {
  const supabase = createBrowserClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  return { error: error?.message ?? null };
}

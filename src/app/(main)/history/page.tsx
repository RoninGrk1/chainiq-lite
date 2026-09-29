export const metadata = {
  title: "History",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">History</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Conversation history will sync here once Supabase Auth is connected
          (Phase 2).
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center">
        <p className="text-sm font-medium text-zinc-200">No saved sessions yet</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Schema is ready in{" "}
          <code className="rounded bg-zinc-800 px-1 py-0.5 text-[11px]">
            supabase/migrations/001_init.sql
          </code>{" "}
          (chat_sessions + chat_messages). Set NEXT_PUBLIC_SUPABASE_URL and the
          anon key to enable persistence.
        </p>
      </div>
    </div>
  );
}

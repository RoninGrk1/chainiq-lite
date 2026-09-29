import { Suspense } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col md:h-screen">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 md:px-6">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Chat</h1>
          <p className="text-xs text-zinc-500">
            Educator mode · UK English · read-only
          </p>
        </div>
        <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
          MVP
        </span>
      </header>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Loading chat…
          </div>
        }
      >
        <ChatWindow />
      </Suspense>
    </div>
  );
}

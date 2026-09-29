import { HistoryClient } from "@/components/history/HistoryClient";

export const metadata = {
  title: "History",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">History</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Saved conversations for your signed-in account. Guest chats are not
          stored.
        </p>
      </header>
      <HistoryClient />
    </div>
  );
}

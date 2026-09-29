type Props = {
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

export function MessageBubble({ role, content, meta }: Props) {
  const isUser = role === "user";
  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={isUser ? "Your message" : "Assistant reply"}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-emerald-600 text-white"
            : "border border-zinc-800 bg-zinc-900 text-zinc-100"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {meta ? (
          <p
            className={`mt-2 text-[10px] ${
              isUser ? "text-emerald-100/80" : "text-zinc-500"
            }`}
          >
            {meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}

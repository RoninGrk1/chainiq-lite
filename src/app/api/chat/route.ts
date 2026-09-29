import { NextResponse } from "next/server";
import {
  chatWithWorkersAI,
  type ChatMessage,
} from "@/lib/ai/cloudflare";
import { clientIp, rateLimit } from "@/lib/utils/rate-limit";
import { isSafeChatMessage, looksLikeSecret } from "@/lib/utils/validation";

export const runtime = "nodejs";

type Body = {
  messages?: { role: string; content: string }[];
  message?: string;
};

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit(`chat:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let messages: ChatMessage[] = [];
  if (Array.isArray(body.messages) && body.messages.length) {
    messages = body.messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          isSafeChatMessage(m.content),
      )
      .slice(-20)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content.trim(),
      }));
  } else if (isSafeChatMessage(body.message)) {
    messages = [{ role: "user", content: body.message.trim() }];
  } else {
    return NextResponse.json(
      { error: "Provide a message (1–4000 chars) or messages array." },
      { status: 400 },
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser && looksLikeSecret(lastUser.content)) {
    return NextResponse.json({
      content:
        "I will not accept or process private keys, seed phrases, or recovery mnemonics. " +
        "If you pasted real secrets, treat them as compromised: move funds to a new wallet and never share keys with any website or chatbot.\n\n" +
        "_Safety notice — ChainIQ Lite is read-only and never needs your keys._",
      model: "safety-guard",
      live: false,
      sources: [],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const result = await chatWithWorkersAI(messages);
    return NextResponse.json({
      content: result.content,
      model: result.model,
      live: result.live,
      sources: result.live
        ? [
            {
              name: "Cloudflare Workers AI",
              url: "https://developers.cloudflare.com/workers-ai/",
            },
          ]
        : [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("chat route error", err);
    return NextResponse.json(
      { error: "Chat failed. Please try again." },
      { status: 500 },
    );
  }
}

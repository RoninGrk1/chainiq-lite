import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Handles email confirmation / magic-link redirects from Supabase Auth.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/settings";

  if (code) {
    const supabase = await createServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, origin));
      }
    }
  }

  return NextResponse.redirect(
    new URL("/settings?authError=callback", origin),
  );
}

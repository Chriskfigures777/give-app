import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the current user's Supabase JWT for Unit testing.
 * Only available in development — use for banking-test.html flow.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Not authenticated. Sign in at /login first." }, { status: 401 });
  }

  return NextResponse.json({ jwt: session.access_token });
}

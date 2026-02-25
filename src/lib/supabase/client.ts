import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

function getBrowserEnv() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();
  if (!url || !anonKey) {
    throw new Error(
      "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server."
    );
  }
  return { url, anonKey };
}

/** Custom fetch that logs Supabase auth failures for easier debugging (dev only). */
function createFetchWithLogging() {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      return await fetch(input, init);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Supabase] Auth fetch failed:", err instanceof Error ? err.message : String(err));
      }
      throw err;
    }
  };
}

export function createClient() {
  const { url, anonKey } = getBrowserEnv();
  return createBrowserClient<Database>(url, anonKey, {
    global: { fetch: createFetchWithLogging() },
  });
}

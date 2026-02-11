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

export function createClient() {
  const { url, anonKey } = getBrowserEnv();
  return createBrowserClient<Database>(url, anonKey);
}

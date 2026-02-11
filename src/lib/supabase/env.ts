/**
 * Supabase URL and anon key. Uses .env.local only (never .env.example).
 * If Next.js hasn't set process.env, we load .env.local from the project root (server-side only).
 */
function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
}

function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();
}

/** Load .env.local into process.env (Node.js server only). Uses .env.local only. */
function loadEnvLocalIfNeeded(): void {
  if (typeof process === "undefined" || !process.versions?.node) return;
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (url && anonKey) return;

  try {
    const path = require("path");
    const fs = require("fs");
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) return;
    let content = fs.readFileSync(envPath, "utf8");
    content = content.replace(/^\uFEFF/, ""); // strip BOM if present
    content.split(/\r?\n/).forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) return;
      const key = trimmed.slice(0, eq).trim();
      const raw = trimmed.slice(eq + 1).trim();
      const value = raw.replace(/^["']|["']$/g, "").trim();
      if (!key) return;
      // Set when missing or empty (Next.js sometimes sets vars to "")
      if (!process.env[key] || process.env[key]!.trim() === "") process.env[key] = value;
    });
  } catch {
    // ignore
  }
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  loadEnvLocalIfNeeded();

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL and anon key are required. Put NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (project root) and restart the dev server."
    );
  }
  return { url, anonKey };
}

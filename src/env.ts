/**
 * Server-safe env: use process.env in server components / API / server actions.
 * Client-safe: only NEXT_PUBLIC_* in client components.
 */
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_CONNECT_CLIENT_ID",
] as const;

function getEnv(key: string): string {
  const v = process.env[key];
  if (!v && required.includes(key as (typeof required)[number])) {
    throw new Error(`Missing env: ${key}`);
  }
  return v ?? "";
}

export const env = {
  supabase: {
    url: () => getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: () => getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: () => getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
  stripe: {
    secretKey: () => getEnv("STRIPE_SECRET_KEY"),
    publishableKey: () => getEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") || getEnv("STRIPE_PUBLISHABLE_KEY"),
    webhookSecret: () => getEnv("STRIPE_WEBHOOK_SECRET") || getEnv("STRIPE_WEBHOOK_SECRET_1") || getEnv("STRIPE_WEBHOOK_SECRET_2"),
    connectClientId: () => getEnv("STRIPE_CONNECT_CLIENT_ID"),
  },
  app: {
    domain: () => process.env.DOMAIN || "http://localhost:3000",
  },
} as const;

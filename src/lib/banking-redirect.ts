/**
 * Exchange ↔ Exchange Banking (BankGO) redirect flow.
 * Allowlisted banking callback only; safe relative paths for `next` to prevent open redirects.
 */

const DEFAULT_BANKING_APP_URL = "";
const BANKING_CALLBACK_PATH = "/auth/callback";
const DEFAULT_NEXT = "/dashboard";

/** Banking app base URL (env overridable). */
export const BANKING_APP_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BANKING_APP_URL) ||
  DEFAULT_BANKING_APP_URL;

/** Allowlisted banking callback URL (no trailing slash). */
export function getBankingCallbackUrl(): string {
  const base = BANKING_APP_URL.replace(/\/$/, "");
  return `${base}${BANKING_CALLBACK_PATH}`;
}

/** Banking app login page (for password login: send user to sign in on banking after Exchange login). */
export function getBankingLoginUrl(params?: { from?: string }): string {
  const base = BANKING_APP_URL.replace(/\/$/, "");
  const search = params?.from ? `?from=${encodeURIComponent(params.from)}` : "";
  return `${base}/login${search}`;
}

/**
 * Only accept return_to if it is exactly the allowlisted banking callback URL.
 * Reject any other host or path (no open redirects).
 */
export function isBankingReturnTo(returnTo: string | null | undefined): boolean {
  if (!returnTo || typeof returnTo !== "string") return false;
  const trimmed = returnTo.trim();
  const allowed = getBankingCallbackUrl();
  return trimmed === allowed || trimmed === `${allowed}/`;
}

/**
 * Safe relative path for `next` (BankGO rules: starts with /, not //, no protocol).
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return DEFAULT_NEXT;
  const trimmed = value.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !/^\/[^/]*:/.test(trimmed)
  ) {
    return trimmed;
  }
  return DEFAULT_NEXT;
}

/**
 * Build banking callback URL with optional next (for Supabase redirectTo / emailRedirectTo).
 * Supabase will append the auth code when redirecting. Use for signup/login redirect targets.
 */
export function buildBankingCallbackRedirectUrl(next?: string | null): string {
  const base = getBankingCallbackUrl();
  const safeNext = safeNextPath(next);
  return `${base}?next=${encodeURIComponent(safeNext)}`;
}

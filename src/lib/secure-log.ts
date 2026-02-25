/**
 * Secure logging utilities.
 * In production, avoid logging sensitive data (org IDs, user IDs, tokens, etc.)
 * to prevent exposure in log aggregation systems.
 */

const isDev = process.env.NODE_ENV === "development";

/** Log only in development. Never logs in production. */
export function devLog(message: string, data?: unknown): void {
  if (isDev) {
    if (data !== undefined) {
      console.log(`[dev] ${message}`, data);
    } else {
      console.log(`[dev] ${message}`);
    }
  }
}

/** Log errors without sensitive payload. Use for server-side error tracking. */
export function secureError(message: string, err?: unknown): void {
  const safeErr = err instanceof Error ? err.message : String(err ?? "");
  console.error(`[error] ${message}`, safeErr);
}

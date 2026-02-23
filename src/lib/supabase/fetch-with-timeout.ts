import { Agent } from "undici";

/**
 * Fetch wrapper with timeout for Supabase Auth/API calls.
 * When Supabase is unreachable (network issues, VPN, etc.), fail fast
 * instead of blocking indefinitely so the app stays responsive.
 * - connectTimeout: 25s (undici default is 10s; Supabase via Cloudflare can be slow)
 * - request timeout: 30s (abort after this)
 */
const CONNECT_TIMEOUT_MS = 25000;
const REQUEST_TIMEOUT_MS = 30000;

const dispatcher = new Agent({ connectTimeout: CONNECT_TIMEOUT_MS });

export function createFetchWithTimeout(): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    const signal =
      init?.signal != null
        ? mergeSignals(init.signal, controller.signal)
        : controller.signal;

    const fetchOptions: RequestInit & { dispatcher?: typeof dispatcher } = {
      ...init,
      signal,
      dispatcher,
    };

    return fetch(input, fetchOptions).finally(() =>
      clearTimeout(timeoutId)
    );
  };
}

function mergeSignals(
  userSignal: AbortSignal,
  timeoutSignal: AbortSignal
): AbortSignal {
  if (userSignal.aborted) return userSignal;
  if (timeoutSignal.aborted) return timeoutSignal;

  const controller = new AbortController();
  const abort = () => controller.abort();
  userSignal.addEventListener("abort", abort);
  timeoutSignal.addEventListener("abort", abort);
  return controller.signal;
}

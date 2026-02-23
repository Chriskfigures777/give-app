/**
 * Fetch wrapper with timeout for Supabase Auth/API calls.
 * When Supabase is unreachable (network issues, VPN, etc.), fail fast
 * instead of blocking indefinitely so the app stays responsive.
 * Set to 15s to accommodate cold starts and proxy latency (~10s observed).
 */
const SUPABASE_FETCH_TIMEOUT_MS = 15000;

export function createFetchWithTimeout(): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      SUPABASE_FETCH_TIMEOUT_MS
    );

    const signal =
      init?.signal != null
        ? mergeSignals(init.signal, controller.signal)
        : controller.signal;

    return fetch(input, { ...init, signal }).finally(() =>
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

/**
 * Fetch wrapper with shorter timeout for Supabase Auth/API calls.
 * When Supabase is unreachable (network issues, VPN, etc.), fail fast
 * instead of blocking for 10+ seconds so the app stays responsive.
 */
const SUPABASE_FETCH_TIMEOUT_MS = 5000;

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

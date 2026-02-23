/**
 * Edge-compatible fetch wrapper with request timeout.
 * Uses only native fetch + AbortController (no undici/node:net).
 * For middleware and other Edge Runtime contexts.
 */
const REQUEST_TIMEOUT_MS = 30000;

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

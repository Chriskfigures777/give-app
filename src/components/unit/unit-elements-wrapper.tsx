"use client";

import Script from "next/script";
import { useState, useEffect, useRef, useCallback } from "react";

function FormLoadingState({ onRetry }: { onRetry?: () => void }) {
  const [slow, setSlow] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setSlow(true), 5000);
    const t2 = setTimeout(() => setShowRetry(true), 15_000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-dashboard-text-muted text-sm">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      <p>Preparing application form…</p>
      {slow && (
        <p className="text-xs text-dashboard-text-muted/80">
          This may take a moment. Unit is creating your form.
        </p>
      )}
      {showRetry && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 underline"
        >
          Taking too long? Try again
        </button>
      )}
    </div>
  );
}

function UnitJwtDebug({ jwtToken }: { jwtToken: string }) {
  const [payload, setPayload] = useState<{ iss?: string; aud?: string; sub?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const decode = () => {
    setLoading(true);
    fetch("/api/unit/debug-auth0-jwt", {
      method: "POST",
      headers: { Authorization: `Bearer ${jwtToken}` },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.iss) setPayload(data);
        else setPayload(null);
      })
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/30">
      <button
        type="button"
        onClick={decode}
        disabled={loading}
        className="font-medium text-amber-800 dark:text-amber-200"
      >
        {loading ? "Decoding…" : "Debug JWT (Unit config)"}
      </button>
      {payload && (
        <div className="mt-2 space-y-1 font-mono text-amber-900 dark:text-amber-100">
          <p>
            <strong>iss:</strong> {payload.iss}
          </p>
          <p>
            <strong>aud:</strong> {typeof payload.aud === "string" ? payload.aud : JSON.stringify(payload.aud)}
          </p>
          <p>
            <strong>sub:</strong> {payload.sub}
          </p>
          <p className="mt-2 text-amber-700 dark:text-amber-300">
            Unit Issuer must match <code>iss</code> exactly.
          </p>
        </div>
      )}
    </div>
  );
}
import { useUnitTokenSupabase } from "@/hooks/use-unit-token";
import { useUnitTokenAuth0 } from "@/hooks/use-unit-token-auth0";

const UNIT_UI_BASE = process.env.NEXT_PUBLIC_UNIT_SANDBOX !== "false" ? "https://ui.s.unit.sh" : "https://ui.unit.co";
const DEFAULT_SCRIPT = `${UNIT_UI_BASE}/release/latest/components-extended.js`;
const USE_AUTH0 = false;

const UNIT_SETTINGS = {
  global: {
    colors: { primary: "#059669" },
    buttons: {
      primary: { default: { border: { radius: "8px" } } },
      outline: { default: { border: { radius: "8px" } } },
      flat: { default: { border: { radius: "8px" } } },
    },
  },
};

type Props = {
  scriptSrc?: string;
  settingsJson?: Record<string, unknown>;
};

/**
 * Wrapper for Unit banking. Uses Auth0 when configured, else Supabase.
 */
export function UnitElementsWrapper(props: Props) {
  return USE_AUTH0 ? (
    <UnitElementsWrapperAuth0 {...props} />
  ) : (
    <UnitElementsWrapperSupabase {...props} />
  );
}

function UnitElementsWrapperSupabase({
  scriptSrc = process.env.NEXT_PUBLIC_UNIT_SCRIPT_URL ?? DEFAULT_SCRIPT,
  settingsJson,
}: Props) {
  return (
    <UnitElementsContent
      {...useUnitTokenSupabase()}
      scriptSrc={scriptSrc}
      settingsJson={settingsJson}
      useAuth0TokenForApi={false}
    />
  );
}

function UnitElementsWrapperAuth0({
  scriptSrc = process.env.NEXT_PUBLIC_UNIT_SCRIPT_URL ?? DEFAULT_SCRIPT,
  settingsJson,
}: Props) {
  return (
    <UnitElementsContent
      {...useUnitTokenAuth0()}
      scriptSrc={scriptSrc}
      settingsJson={settingsJson}
      useAuth0TokenForApi={true}
    />
  );
}

type ContentProps = Props & {
  jwtToken: string | null;
  hasCustomer: boolean | null;
  loading: boolean;
  error: string | null;
  needsAuth0Login: boolean;
  refetch: () => Promise<void>;
  loginWithAuth0: () => void;
  useAuth0TokenForApi: boolean;
};

function UnitElementsContent({
  jwtToken,
  hasCustomer,
  loading,
  error,
  needsAuth0Login,
  refetch,
  loginWithAuth0,
  scriptSrc,
  settingsJson,
  useAuth0TokenForApi,
}: ContentProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [formState, setFormState] = useState<{ id: string; token: string } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formRetryKey, setFormRetryKey] = useState(0);
  const [unitCustomerToken, setUnitCustomerToken] = useState<string | null>(null);
  const [customerTokenFailed, setCustomerTokenFailed] = useState(false);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const whiteLabelRef = useRef<HTMLElement | null>(null);
  const settings = { ...UNIT_SETTINGS, ...settingsJson };
  const needScript = !!jwtToken;

  const FORM_FETCH_TIMEOUT_MS = 30_000;

  // When customer-token fails (404 no account, 400 e.g. kid/JWKS error), show application form instead of being stuck
  const showFormInsteadOfDashboard = customerTokenFailed;
  const effectiveHasCustomer = hasCustomer === true && !customerTokenFailed;

  useEffect(() => {
    if (hasCustomer === false) setCustomerTokenFailed(false);
  }, [hasCustomer]);

  // React may not pass attributes to custom elements correctly; set explicitly when token changes
  const isWhiteLabelVisible =
    effectiveHasCustomer &&
    scriptReady &&
    (useAuth0TokenForApi ? !!unitCustomerToken : true);
  useEffect(() => {
    const el = whiteLabelRef.current;
    if (!el || !isWhiteLabelVisible) return;
    if (useAuth0TokenForApi && unitCustomerToken) {
      el.setAttribute("customer-token", unitCustomerToken);
      el.removeAttribute("jwt-token");
    } else if (jwtToken) {
      el.setAttribute("jwt-token", jwtToken);
      el.removeAttribute("customer-token");
    }
  }, [isWhiteLabelVisible, jwtToken, unitCustomerToken, useAuth0TokenForApi]);

  // For Auth0 white-label app: exchange JWT for Unit customer token (Unit requires this)
  useEffect(() => {
    if (hasCustomer !== true || !jwtToken || !useAuth0TokenForApi || !scriptReady) return;

    let cancelled = false;
    setCustomerTokenFailed(false);
    fetch("/api/unit/customer-token", {
      method: "GET",
      credentials: "include",
      headers: { Authorization: `Bearer ${jwtToken}` },
    })
      .then(async (res) => {
        const data = await res.json();
        return { res, data };
      })
      .then(({ res, data }) => {
        if (cancelled) return;
        if (data.token) {
          setUnitCustomerToken(data.token);
          setCustomerTokenFailed(false);
        } else if (res.status === 404 || res.status === 400) {
          // 404 = no banking account; 400 = e.g. JWKS kid mismatch — fall back to application form
          setCustomerTokenFailed(true);
          setUnitCustomerToken(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnitCustomerToken(null);
          setCustomerTokenFailed(true);
        }
      });

    return () => { cancelled = true; };
  }, [hasCustomer, jwtToken, useAuth0TokenForApi, scriptReady]);

  const retryFormFetch = useCallback(() => {
    setFormState(null);
    setFormError(null);
    setFormLoading(false);
    setFormRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const needsForm = hasCustomer === false || showFormInsteadOfDashboard;
    if (!needsForm || !jwtToken || formState || formLoading) return;

    let cancelled = false;
    setFormLoading(true);
    setFormError(null);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (useAuth0TokenForApi && jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FORM_FETCH_TIMEOUT_MS);

    fetch("/api/unit/create-application-form", {
      method: "POST",
      credentials: "include",
      headers,
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setFormError(data.error);
          return;
        }
        setFormState({
          id: data.applicationFormId,
          token: data.applicationFormToken,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.name === "AbortError") {
          setFormError("Request timed out. The Unit API may be slow. Please try again.");
        } else {
          setFormError("Failed to create application form");
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (!cancelled) setFormLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [hasCustomer, showFormInsteadOfDashboard, jwtToken, formState, formLoading, useAuth0TokenForApi, formRetryKey]);

  useEffect(() => {
    if (!formState || !scriptReady) return;

    let cleanup: (() => void) | undefined;
    const id = setTimeout(() => {
      const container = formContainerRef.current;
      const el = container?.querySelector("unit-elements-application-form");
      if (!el) return;

      const handler = async () => {
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          await refetch();
          const res = await fetch("/api/unit/customer-status", { credentials: "include" });
          const data = await res.json().catch(() => ({}));
          if (data.hasCustomer) {
            setFormState(null);
            return;
          }
        }
        setFormState(null);
      };

      el.addEventListener("unitApplicationFormCompleted", handler);
      cleanup = () => el.removeEventListener("unitApplicationFormCompleted", handler);
    }, 100);

    return () => {
      clearTimeout(id);
      cleanup?.();
    };
  }, [formState, scriptReady, refetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
        Loading banking…
      </div>
    );
  }

  if (needsAuth0Login) {
    return (
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center space-y-4">
        <p className="text-sm text-dashboard-text-muted">
          Sign in with Auth0 to access banking. If you recently switched accounts, you may need to sign in again.
        </p>
        <button
          onClick={loginWithAuth0}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-opacity hover:opacity-90"
        >
          Sign in with Auth0
        </button>
      </div>
    );
  }

  if (!jwtToken) {
    return (
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center space-y-4">
        <p className="text-sm text-dashboard-text-muted">
          Please sign in to access banking.
        </p>
        <a
          href="/login?redirect=/dashboard/banking"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-opacity hover:opacity-90"
        >
          Sign in
        </a>
      </div>
    );
  }

  if (scriptError) {
    return (
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-amber-600">
        Failed to load the banking interface. Please refresh the page or try again later.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-amber-600 space-y-4">
        <p>{error}</p>
        <button
          onClick={() => refetch()}
          className="text-sm underline text-dashboard-text hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const showApplicationForm = (hasCustomer === false || showFormInsteadOfDashboard) && formState && scriptReady;

  return (
    <>
      {needScript && (
        <Script
          src={scriptSrc}
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onError={() => setScriptError(true)}
        />
      )}

      {isWhiteLabelVisible && jwtToken && (
        <div className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <UnitJwtDebug jwtToken={jwtToken} />
          )}
          {/* @ts-expect-error - Unit custom element. Auth0: pass customer-token (exchanged from JWT). Supabase: pass jwt-token. */}
          <unit-elements-white-label-app
            ref={(el: HTMLElement | null) => { whiteLabelRef.current = el; }}
            {...(useAuth0TokenForApi && unitCustomerToken
              ? { "customer-token": unitCustomerToken }
              : { "jwt-token": jwtToken })}
            settings-json={JSON.stringify(settings)}
          />
        </div>
      )}

      {showApplicationForm && formState && jwtToken && (
        <div ref={formContainerRef} className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <UnitJwtDebug jwtToken={jwtToken} />
          )}
          {/* @ts-expect-error - Unit custom element */}
          <unit-elements-application-form
            application-form-id={formState.id}
            application-form-token={formState.token}
            jwt-token={jwtToken}
            settings-json={JSON.stringify(settings)}
          />
        </div>
      )}

      {(hasCustomer === false || showFormInsteadOfDashboard) && formLoading && (
        <FormLoadingState onRetry={retryFormFetch} />
      )}

      {(hasCustomer === false || showFormInsteadOfDashboard) && formError && !formState && (
        <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-amber-600 space-y-4">
          <p>{formError}</p>
          <button
            onClick={() => {
              setFormError(null);
              setFormLoading(false);
              window.location.reload();
            }}
            className="text-sm underline text-dashboard-text hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {needScript && !scriptReady && !scriptError && (
        <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
          Initializing banking…
        </div>
      )}

      {effectiveHasCustomer && scriptReady && useAuth0TokenForApi && !unitCustomerToken && !customerTokenFailed && (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-dashboard-text-muted text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Exchanging token for Unit…
        </div>
      )}
    </>
  );
}

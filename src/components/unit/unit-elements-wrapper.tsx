"use client";

import Script from "next/script";
import { useState, useEffect, useRef } from "react";
import { useUnitTokenSupabase } from "@/hooks/use-unit-token";
import { useUnitTokenAuth0 } from "@/hooks/use-unit-token-auth0";

const UNIT_UI_BASE = process.env.NEXT_PUBLIC_UNIT_SANDBOX !== "false" ? "https://ui.s.unit.sh" : "https://ui.unit.co";
const DEFAULT_SCRIPT = `${UNIT_UI_BASE}/release/latest/components-extended.js`;
const USE_AUTH0 = !!(process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "unit-elements-white-label-app": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "jwt-token"?: string;
          "customer-token"?: string;
          "settings-json"?: string;
          theme?: string;
          language?: string;
        },
        HTMLElement
      >;
      "unit-elements-application-form": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "application-form-id"?: string;
          "application-form-token"?: string;
          "jwt-token"?: string;
          "settings-json"?: string;
          theme?: string;
          language?: string;
        },
        HTMLElement
      >;
    }
  }
}

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
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const settings = { ...UNIT_SETTINGS, ...settingsJson };
  const needScript = !!jwtToken;

  useEffect(() => {
    if (hasCustomer !== false || !jwtToken || formState || formLoading) return;

    let cancelled = false;
    setFormLoading(true);
    setFormError(null);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (useAuth0TokenForApi && jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }

    fetch("/api/unit/create-application-form", {
      method: "POST",
      credentials: "include",
      headers,
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
      .catch(() => {
        if (!cancelled) setFormError("Failed to create application form");
      })
      .finally(() => {
        if (!cancelled) setFormLoading(false);
      });

    return () => { cancelled = true; };
  }, [hasCustomer, jwtToken, formState, formLoading, useAuth0TokenForApi]);

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
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-dashboard-text-muted space-y-4">
        <p>Sign in with Auth0 to access banking.</p>
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
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-dashboard-text-muted">
        Please{" "}
        <a href="/login" className="underline text-dashboard-text">
          sign in
        </a>{" "}
        to access banking.
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

  const showDashboard = hasCustomer === true && scriptReady;
  const showApplicationForm = hasCustomer === false && formState && scriptReady;

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

      {showDashboard && jwtToken && (
        <unit-elements-white-label-app
          jwt-token={jwtToken}
          settings-json={JSON.stringify(settings)}
        />
      )}

      {showApplicationForm && formState && (
        <div ref={formContainerRef}>
          <unit-elements-application-form
            application-form-id={formState.id}
            application-form-token={formState.token}
            jwt-token={jwtToken}
            settings-json={JSON.stringify(settings)}
          />
        </div>
      )}

      {hasCustomer === false && formLoading && (
        <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
          Preparing application form…
        </div>
      )}

      {hasCustomer === false && formError && !formState && (
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
    </>
  );
}

"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "unit-elements-white-label-app": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "jwt-token"?: string;
          "customer-token"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export default function BankingPage() {
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCustomer, setHasCustomer] = useState<boolean | null>(null);
  // New users see a CTA first; clicking "Open an Account" sets this to true
  const [startOnboarding, setStartOnboarding] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/unit/customer-token", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.token) {
          setCustomerToken(data.token);
          setHasCustomer(true);
        } else if (res.status === 404 && data.hasCustomer === false) {
          setHasCustomer(false);
          setJwtToken(session.access_token);
        } else {
          setError(data.error ?? "Failed to load banking");
        }
      } catch {
        setError("Failed to load banking");
      } finally {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setCustomerToken(null);
        setJwtToken(null);
        setError(null);
        return;
      }
      try {
        const res = await fetch("/api/unit/customer-token", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.token) {
          setCustomerToken(data.token);
          setHasCustomer(true);
        } else if (res.status === 404) {
          setHasCustomer(false);
          setJwtToken(session.access_token);
        } else {
          setCustomerToken(null);
          setJwtToken(null);
          setError(data.error ?? "Failed to load banking");
        }
      } catch {
        setCustomerToken(null);
        setJwtToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Existing customer → show their banking dashboard
  const showDashboard = !!(customerToken && scriptReady);
  // New user who clicked "Open an Account" → show the application form
  const showApplicationForm = !!(hasCustomer === false && jwtToken && startOnboarding && scriptReady);
  // New user who hasn't started yet → show the CTA card
  const showOnboardingCTA = hasCustomer === false && !startOnboarding && !loading;

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <Script
        src="https://ui.s.unit.sh/release/latest/components-extended.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setScriptError(true)}
      />

      <div className="dashboard-fade-in flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Banking</h1>
        <p className="text-dashboard-text-muted text-sm">
          Manage your banking, payments, and financial activity.
        </p>
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-1 min-h-[600px]">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
            Loading banking…
          </div>
        )}

        {/* Not logged in */}
        {!loading && !customerToken && !jwtToken && !error && (
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-dashboard-text-muted">
            Session expired. Please{" "}
            <a href="/login" className="underline text-dashboard-text">
              sign in again
            </a>{" "}
            to access banking.
          </div>
        )}

        {/* Script failed to load */}
        {!loading && scriptError && (
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-amber-600">
            Failed to load the banking interface. Please refresh the page or try again later.
          </div>
        )}

        {/* API error */}
        {!loading && !scriptError && error && (
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-amber-600">
            {error}
          </div>
        )}

        {/* New user — "Open a Banking Account" CTA */}
        {showOnboardingCTA && (
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-10 flex flex-col items-center text-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>

            <div className="max-w-sm">
              <h2 className="text-xl font-bold text-dashboard-text">Open a Banking Account</h2>
              <p className="mt-2 text-sm text-dashboard-text-muted">
                Get a FDIC-insured checking account, debit card, and bill pay — all in one place.
                Takes about 5 minutes to apply.
              </p>
            </div>

            <ul className="flex flex-col gap-2 text-sm text-dashboard-text-muted text-left w-full max-w-xs">
              {[
                "FDIC-insured checking account",
                "Free debit card",
                "ACH transfers & bill pay",
                "Mobile check deposit",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setStartOnboarding(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-opacity hover:opacity-90"
            >
              Open an Account
            </button>
          </div>
        )}

        {/* Existing customer — banking dashboard */}
        {showDashboard && (
          // @ts-ignore
          <unit-elements-white-label-app customer-token={customerToken} />
        )}

        {/* New user — Unit application form */}
        {showApplicationForm && (
          // @ts-ignore
          <unit-elements-white-label-app jwt-token={jwtToken} />
        )}

        {/* Waiting for script to load (existing customer) */}
        {!loading && customerToken && !scriptReady && !scriptError && (
          <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
            Initializing banking interface…
          </div>
        )}

        {/* Waiting for script to load (new user starting onboarding) */}
        {!loading && startOnboarding && jwtToken && !scriptReady && !scriptError && (
          <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
            Opening account application…
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "unit-elements-white-label-app": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "jwt-token"?: string; "customer-token"?: string },
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
  const [error, setError] = useState<string | null>(null);
  const [hasCustomer, setHasCustomer] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/unit/customer-token");
        const data = await res.json();
        if (res.ok && data.token) {
          setCustomerToken(data.token);
          setHasCustomer(true);
          setError(null);
        } else if (res.status === 404 && data.hasCustomer === false) {
          setHasCustomer(false);
          setJwtToken(session.access_token);
          setError(null);
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
        const res = await fetch("/api/unit/customer-token");
        const data = await res.json();
        if (res.ok && data.token) {
          setCustomerToken(data.token);
          setHasCustomer(true);
          setError(null);
        } else if (res.status === 404) {
          setCustomerToken(null);
          setHasCustomer(false);
          setJwtToken(session.access_token);
          setError(null);
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

  const showApp = (customerToken && scriptReady) || (hasCustomer === false && jwtToken && scriptReady);
  const token = customerToken ?? jwtToken;

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <Script
        src="https://ui.s.unit.sh/release/latest/components-extended.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

      <div className="dashboard-fade-in flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
          Banking
        </h1>
        <p className="text-dashboard-text-muted text-sm">
          Manage your banking, payments, and financial activity.
        </p>
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-1 min-h-[600px]" ref={containerRef}>
        {loading && (
          <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
            Loading banking…
          </div>
        )}

        {!loading && !token && !error && (
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-dashboard-text-muted">
            Session expired. Please{" "}
            <a href="/login" className="underline text-dashboard-text">
              sign in again
            </a>{" "}
            to access banking.
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-amber-600">
            {error}
          </div>
        )}

        {!loading && showApp && token && (
          // @ts-ignore – customer-token when approved; jwt-token for new users (application form)
          <unit-elements-white-label-app
            {...(customerToken ? { "customer-token": customerToken } : { "jwt-token": jwtToken! })}
          />
        )}

        {!loading && token && !scriptReady && (
          <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
            Initializing banking interface…
          </div>
        )}
      </div>
    </div>
  );
}

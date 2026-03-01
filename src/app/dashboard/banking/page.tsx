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
  const [loading, setLoading] = useState(true);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setError(null);
        return;
      }
      try {
        const res = await fetch("/api/unit/customer-token");
        const data = await res.json();
        if (res.ok && data.token) {
          setCustomerToken(data.token);
          setError(null);
        } else {
          setCustomerToken(null);
          setError(data.error ?? "Failed to load banking");
        }
      } catch {
        setCustomerToken(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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

        {!loading && !customerToken && !error && (
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

        {!loading && customerToken && scriptReady && (
          // @ts-ignore – custom web component; customer-token bypasses JWT 401
          <unit-elements-white-label-app customer-token={customerToken} />
        )}

        {!loading && customerToken && !scriptReady && (
          <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
            Initializing banking interface…
          </div>
        )}
      </div>
    </div>
  );
}

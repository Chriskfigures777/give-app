"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "unit-elements-white-label-app": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "jwt-token"?: string },
        HTMLElement
      >;
    }
  }
}

export default function BankingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scriptReady, setScriptReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      setLoading(false);
    });

    // Keep token fresh on session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
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

        {!loading && !token && (
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-8 text-center text-sm text-dashboard-text-muted">
            Session expired. Please{" "}
            <a href="/login" className="underline text-dashboard-text">
              sign in again
            </a>{" "}
            to access banking.
          </div>
        )}

        {!loading && token && scriptReady && (
          // @ts-ignore – custom web component
          <unit-elements-white-label-app jwt-token={token} />
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

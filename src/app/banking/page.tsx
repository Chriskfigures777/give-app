"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Script
        src="https://ui.s.unit.sh/release/latest/components-extended.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

      <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>

        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-slate-400">Loading banking…</span>
          </div>
        )}

        {!loading && !token && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Banking</h1>
              <p className="mt-2 text-sm text-slate-500">Sign in to access your banking dashboard.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-opacity">
                Log in to Banking
              </Link>
              <Link href="/signup" className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-colors">
                Create account
              </Link>
            </div>
          </div>
        )}

        {!loading && token && !scriptReady && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-slate-400">Initializing banking interface…</span>
          </div>
        )}

        {!loading && token && scriptReady && (
          <div className="flex-1 w-full">
            {/* @ts-ignore – custom web component */}
            <unit-elements-white-label-app jwt-token={token} />
          </div>
        )}
      </div>
    </>
  );
}

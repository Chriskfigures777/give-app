"use client";

import Script from "next/script";
import { useState } from "react";
import Link from "next/link";

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

/**
 * Unit Ready-to-Launch Sandbox Demo
 *
 * Uses demo.jwt.token — a real value from Unit for previewing the component
 * without any setup. Sandbox OTP code: 000001
 *
 * @see https://www.unit.co/docs/ready-to-launch/banking/implementation/
 */
export default function BankingDemoPage() {
  const [scriptReady, setScriptReady] = useState(false);

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <Script
        src="https://ui.s.unit.sh/release/latest/components-extended.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setScriptReady(false)}
      />

      <div className="dashboard-fade-in flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">
              Banking Demo
            </h1>
            <p className="text-dashboard-text-muted text-sm mt-1">
              Unit sandbox preview — no setup required. OTP code: <code className="rounded bg-dashboard-border px-1.5 py-0.5 font-mono text-xs">000001</code>
            </p>
          </div>
          <Link
            href="/dashboard/banking"
            className="text-sm text-dashboard-text-muted hover:text-dashboard-text underline"
          >
            ← Back to Banking
          </Link>
        </div>
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-1 min-h-[600px] rounded-xl border border-dashboard-border bg-dashboard-card overflow-hidden">
        {scriptReady ? (
          // @ts-ignore
          <unit-elements-white-label-app jwt-token="demo.jwt.token" />
        ) : (
          <div className="flex items-center justify-center py-24 text-dashboard-text-muted text-sm">
            Loading Unit demo…
          </div>
        )}
      </div>
    </div>
  );
}

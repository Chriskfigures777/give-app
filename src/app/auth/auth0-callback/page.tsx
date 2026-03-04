"use client";

import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

/**
 * Auth0 callback page. Auth0 redirects here after login.
 * Processes the callback and redirects to dashboard.
 */
export default function Auth0CallbackPage() {
  const { handleRedirectCallback, isAuthenticated } = useAuth0();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);
      const hasError = params.has("error");

      if (hasError) {
        const err = params.get("error_description") ?? params.get("error") ?? "Sign in failed";
        setError(err);
        return;
      }

      if (params.has("code")) {
        try {
          await handleRedirectCallback();
          if (!cancelled) window.location.replace("/dashboard");
        } catch (err) {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : "Failed to complete sign in";
            console.error("[Auth0 callback]", err);
            setError(msg);
          }
        }
      } else if (isAuthenticated) {
        if (!cancelled) window.location.replace("/dashboard");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [handleRedirectCallback, isAuthenticated]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-4">
          <p className="font-medium text-red-800">{error}</p>
          {error.toLowerCase().includes("unauthorized") && (
            <p className="text-sm text-red-700">
              In Auth0 Dashboard: ensure Application type is &quot;Single Page Application&quot;, and Allowed Web Origins includes{" "}
              <code className="rounded bg-red-100 px-1">http://localhost:3000</code>.
            </p>
          )}
          <a
            href="/dashboard"
            className="inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-slate-600">Completing sign in…</p>
      </div>
    </div>
  );
}

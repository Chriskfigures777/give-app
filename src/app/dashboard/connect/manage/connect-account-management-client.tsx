"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadConnectAndInitialize } from "@stripe/connect-js";

/**
 * Fetches an Account Session for account-management (update bank, billing, business info).
 */
async function fetchAccountSessionClientSecret(): Promise<string> {
  const res = await fetch("/api/connect/account-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ component: "account_management" }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data.error as string) ?? res.statusText ?? "Failed to create session");
  }
  const data = await res.json();
  const secret = data.client_secret;
  if (!secret || typeof secret !== "string") throw new Error("Missing client secret");
  return secret;
}

type Props = { publishableKey?: string };

function ConnectAccountManagementClient({ publishableKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const key = publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!key) {
      setError("Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY or STRIPE_PUBLISHABLE_KEY to .env.local");
      setLoading(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const stripeConnectInstance = loadConnectAndInitialize({
      publishableKey: key,
      fetchClientSecret: fetchAccountSessionClientSecret,
      appearance: {
        variables: {
          fontFamily: "system-ui, -apple-system, sans-serif",
          colorPrimary: "#0d9488",
          colorBackground: "#ffffff",
          colorText: "#0f172a",
          borderRadius: "8px",
        },
      },
    });

    const accountManagement = stripeConnectInstance.create("account-management");

    accountManagement.setOnLoadError((loadError) => {
      setError(loadError?.error?.message ?? "Failed to load account management.");
      setLoading(false);
    });

    accountManagement.setOnLoaderStart(() => {
      setLoading(false);
    });

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(accountManagement);

    return () => {
      try {
        if (accountManagement.parentNode === container) {
          container.removeChild(accountManagement);
        }
      } catch {
        // already removed
      }
    };
  }, [key]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="mt-4 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          Back to settings
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      )}
      <div
        ref={containerRef}
        className="min-h-[320px] rounded-xl border-2 border-slate-200 bg-slate-50/50 p-6 shadow-sm"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
}

export default ConnectAccountManagementClient;

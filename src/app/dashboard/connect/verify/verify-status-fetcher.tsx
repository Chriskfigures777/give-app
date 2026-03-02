"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Fetches fresh verification status from Stripe on mount.
 * If the account is verified, triggers a refresh so the server re-renders with the correct state.
 */
export function VerifyStatusFetcher() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/connect/check-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (cancelled) return;
        const data = await res.json();
        if (data?.verified === true) {
          router.refresh();
        }
      } catch {
        // ignore
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

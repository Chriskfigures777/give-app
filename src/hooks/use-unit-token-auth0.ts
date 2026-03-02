"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth0 } from "@auth0/auth0-react";

const FETCH_TIMEOUT_MS = 15_000;

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
    ),
  ]);
}

export type UnitTokenState = {
  jwtToken: string | null;
  hasCustomer: boolean | null;
  loading: boolean;
  error: string | null;
  needsAuth0Login: boolean;
};

export type UnitTokenActions = {
  refetch: () => Promise<void>;
  loginWithAuth0: () => void;
};

/**
 * Auth0 Unit token. Used when Auth0 is configured for banking.
 * Must be used inside Auth0Provider.
 */
export function useUnitTokenAuth0(): UnitTokenState & UnitTokenActions {
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [hasCustomer, setHasCustomer] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth0Login, setNeedsAuth0Login] = useState(false);

  const fetchState = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setJwtToken(null);
      setHasCustomer(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setNeedsAuth0Login(true);
      setJwtToken(null);
      setHasCustomer(null);
      setLoading(false);
      return;
    }

    setNeedsAuth0Login(false);
    try {
      const audience = process.env.NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE;
      const token = await getAccessTokenSilently({
        ...(audience && { authorizationParams: { audience } }),
      });
      setJwtToken(token);

      await fetch("/api/auth0/link", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      const res = await fetchWithTimeout(
        "/api/unit/customer-status",
        { credentials: "include" },
        FETCH_TIMEOUT_MS
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHasCustomer(data.hasCustomer ?? false);
        setError(null);
      } else {
        setError("Failed to load banking status");
        setHasCustomer(null);
      }
    } catch (err) {
      if (err && typeof err === "object" && "error" in err && (err as { error: string }).error === "login_required") {
        setNeedsAuth0Login(true);
        setJwtToken(null);
      } else {
        setError(
          err instanceof Error && err.message === "Request timed out"
            ? "Request timed out. Please try again."
            : "Failed to load banking"
        );
      }
      setHasCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoading(true);
    try {
      if (isAuthenticated) {
        const audience = process.env.NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE;
        const token = await getAccessTokenSilently({
          ...(audience && { authorizationParams: { audience } }),
        });
        setJwtToken(token);
      }
      const res = await fetchWithTimeout(
        "/api/unit/customer-status",
        { credentials: "include" },
        FETCH_TIMEOUT_MS
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHasCustomer(data.hasCustomer ?? false);
        setError(null);
      }
    } catch {
      // Keep previous state
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  const loginWithAuth0 = useCallback(() => {
    loginWithRedirect({
      appState: { returnTo: typeof window !== "undefined" ? window.location.pathname : "/dashboard/banking" },
    });
  }, [loginWithRedirect]);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError("Loading is taking longer than expected. Please refresh the page.");
          return false;
        }
        return prev;
      });
    }, 12_000);

    fetchState();

    return () => clearTimeout(safetyTimer);
  }, [fetchState]);

  return {
    jwtToken,
    hasCustomer,
    loading,
    error,
    needsAuth0Login,
    refetch,
    loginWithAuth0,
  };
}

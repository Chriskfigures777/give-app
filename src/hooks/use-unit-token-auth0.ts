"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth0 } from "@auth0/auth0-react";

const FETCH_TIMEOUT_MS = 15_000;
const AUTH0_TOKEN_TIMEOUT_MS = 10_000;
const LINK_TIMEOUT_MS = 10_000;
const SAFETY_TIMER_MS = 8_000;

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
  const { isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently, loginWithPopup } = useAuth0();
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
      const token = await Promise.race([
        getAccessTokenSilently({
          ...(audience && { authorizationParams: { audience } }),
          cacheMode: "off", // Force fresh token — cached tokens can have stale kid if Auth0 rotated keys
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth0 token timed out")), AUTH0_TOKEN_TIMEOUT_MS)
        ),
      ]);
      setJwtToken(token);

      const linkRes = await fetchWithTimeout(
        "/api/auth0/link",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        },
        LINK_TIMEOUT_MS
      );
      if (!linkRes.ok) {
        const body = await linkRes.json().catch(() => ({}));
        console.warn("[auth0/link]", linkRes.status, body.detail ?? body.error ?? "Link failed");
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
      } else {
        setError("Failed to load banking status");
        setHasCustomer(null);
      }
    } catch (err) {
      if (err && typeof err === "object" && "error" in err && (err as { error: string }).error === "login_required") {
        setNeedsAuth0Login(true);
        setJwtToken(null);
      } else {
        const msg = err instanceof Error ? err.message : "Failed to load banking";
        setError(
          msg === "Request timed out" || msg === "Auth0 token timed out"
            ? "Request timed out. Please try again."
            : "Failed to load banking"
        );
      }
      setHasCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  const isReady = !auth0Loading;

  useEffect(() => {
    if (!isReady) return;

    const safetyTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError("Loading is taking longer than expected. Please refresh or try again.");
          return false;
        }
        return prev;
      });
    }, SAFETY_TIMER_MS);

    fetchState();

    // Re-run when Supabase session changes (e.g. user signs in from another tab or session loads)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchState();
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchState, isReady]);

  // If Auth0 is loading for too long, surface an error so user isn't stuck
  useEffect(() => {
    if (!auth0Loading) return;
    const t = setTimeout(() => {
      setError("Auth0 is taking too long to initialize. Please refresh the page.");
      setLoading(false);
    }, 12_000);
    return () => clearTimeout(t);
  }, [auth0Loading]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      if (isAuthenticated) {
        const audience = process.env.NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE;
        const token = await getAccessTokenSilently({
          ...(audience && { authorizationParams: { audience } }),
          cacheMode: "off",
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

  const loginWithAuth0 = useCallback(async () => {
    try {
      await loginWithPopup({
        ...(process.env.NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE && {
          authorizationParams: { audience: process.env.NEXT_PUBLIC_AUTH0_BANKING_AUDIENCE },
        }),
      });
      // Popup keeps user on page — Supabase session preserved. Refresh state to load banking.
      await fetchState();
    } catch (err) {
      if (err && typeof err === "object" && "error" in err && (err as { error: string }).error === "popup_closed") {
        // User closed popup — no action needed
      } else {
        console.error("[Auth0] Popup login failed", err);
      }
    }
  }, [loginWithPopup, fetchState]);

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

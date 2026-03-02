"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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
 * Supabase-only Unit token. Used when Auth0 is not configured.
 */
export function useUnitTokenSupabase(): UnitTokenState & UnitTokenActions {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [hasCustomer, setHasCustomer] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await fetchWithTimeout(
        "/api/unit/customer-status",
        { credentials: "include" },
        FETCH_TIMEOUT_MS
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setJwtToken(session.access_token);
        setHasCustomer(data.hasCustomer ?? false);
        setError(null);
      } else {
        setError("Failed to load banking status");
        setHasCustomer(null);
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === "Request timed out"
          ? "Request timed out. Please try again."
          : "Failed to load banking"
      );
      setHasCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetchWithTimeout(
        "/api/unit/customer-status",
        { credentials: "include" },
        FETCH_TIMEOUT_MS
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setJwtToken(session.access_token);
        setHasCustomer(data.hasCustomer ?? false);
        setError(null);
      }
    } catch {
      // Keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

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

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setJwtToken(null);
        setHasCustomer(null);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      await fetchState();
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchState]);

  return {
    jwtToken,
    hasCustomer,
    loading,
    error,
    needsAuth0Login: false,
    refetch,
    loginWithAuth0: () => {},
  };
}

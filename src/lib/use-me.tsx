"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@/lib/use-user";

export type MeData = {
  userId: string;
  orgId: string | null;
  orgSlug: string | null;
  isOrgOwner: boolean;
  avatarUrl: string | null;
  orgLogoUrl: string | null;
  unreadNotificationsCount?: number;
  pendingConnectionRequestsCount?: number;
};

const MeContext = createContext<{
  me: MeData | null;
  loading: boolean;
  error: boolean;
  refetch: () => void;
  setUnreadNotificationsCount: (n: number) => void;
  setPendingConnectionRequestsCount: (n: number) => void;
} | null>(null);

/** Provider that fetches /api/me once when user exists. Wrap app in layout. */
export function MeProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const setUnreadNotificationsCount = useCallback((n: number) => {
    setMe((prev) => (prev ? { ...prev, unreadNotificationsCount: n } : null));
  }, []);

  const setPendingConnectionRequestsCount = useCallback((n: number) => {
    setMe((prev) => (prev ? { ...prev, pendingConnectionRequestsCount: n } : null));
  }, []);

  const fetchMe = useCallback(async () => {
    if (!user) {
      setMe(null);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/me?counts=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMe({
        userId: data.userId,
        orgId: data.orgId ?? null,
        orgSlug: data.orgSlug ?? null,
        isOrgOwner: data.isOrgOwner ?? false,
        avatarUrl: data.avatarUrl ?? null,
        orgLogoUrl: data.orgLogoUrl ?? null,
        unreadNotificationsCount: data.unreadNotificationsCount ?? 0,
        pendingConnectionRequestsCount: data.pendingConnectionRequestsCount ?? 0,
      });
    } catch {
      setMe(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <MeContext.Provider
      value={{
        me,
        loading,
        error,
        refetch: fetchMe,
        setUnreadNotificationsCount,
        setPendingConnectionRequestsCount,
      }}
    >
      {children}
    </MeContext.Provider>
  );
}

export function useMe() {
  const ctx = useContext(MeContext);
  return (
    ctx ?? {
      me: null,
      loading: false,
      error: false,
      refetch: () => {},
      setUnreadNotificationsCount: () => {},
      setPendingConnectionRequestsCount: () => {},
    }
  );
}

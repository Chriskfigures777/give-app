"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type DonationItem = {
  id: string;
  amount_cents: number;
  donor_initial: string;
  donor_display: string;
  org_name: string | null;
  created_at: string;
};

const DonationsContext = createContext<{
  donations: DonationItem[];
  loading: boolean;
} | null>(null);

/** Provider that fetches /api/donations/recent once and shares between HeroSection + LiveDonationFeed. */
export function DonationsProvider({ children }: { children: ReactNode }) {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDonations = useCallback(async () => {
    try {
      const res = await fetch("/api/donations/recent");
      const json = await res.json();
      if (json.donations?.length) setDonations(json.donations);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
    const id = setInterval(fetchDonations, 30_000);
    return () => clearInterval(id);
  }, [fetchDonations]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("donations-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "donations", filter: "status=eq.succeeded" },
        (payload) => {
          const d = payload.new as Record<string, unknown>;
          const name = (d.donor_name as string) || "Anonymous";
          const firstInitial = name.charAt(0).toUpperCase();
          const isAnon = !d.donor_name || name.toLowerCase() === "anonymous";
          const newDonation: DonationItem = {
            id: d.id as string,
            amount_cents: d.amount_cents as number,
            donor_initial: firstInitial,
            donor_display: isAnon ? "Anonymous" : `${name.split(" ")[0]} ${name.split(" ").pop()?.charAt(0) || ""}.`,
            org_name: (d.org_name as string) ?? null,
            created_at: d.created_at as string,
          };
          setDonations((prev) => [newDonation, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <DonationsContext.Provider value={{ donations, loading }}>
      {children}
    </DonationsContext.Provider>
  );
}

export function useDonations() {
  const ctx = useContext(DonationsContext);
  return ctx ?? { donations: [], loading: true };
}

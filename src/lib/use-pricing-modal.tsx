"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { PricingModal } from "@/components/pricing-modal";

type PricingModalContextValue = {
  openPricingModal: () => void;
};

const PricingModalContext = createContext<PricingModalContextValue | null>(null);

export function PricingModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPricingModal = useCallback(() => setOpen(true), []);

  return (
    <PricingModalContext.Provider value={{ openPricingModal }}>
      {children}
      <PricingModal open={open} onOpenChange={setOpen} />
    </PricingModalContext.Provider>
  );
}

export function usePricingModal() {
  const ctx = useContext(PricingModalContext);
  if (!ctx) {
    throw new Error("usePricingModal must be used within PricingModalProvider");
  }
  return ctx;
}

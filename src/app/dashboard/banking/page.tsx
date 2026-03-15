"use client";

import { useEffect } from "react";
import { UnitElementsWrapper } from "@/components/unit";
import { useUnitTokenAuth0 } from "@/hooks/use-unit-token-auth0";

const USE_AUTH0 = !!(process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);

const UNIT_SCRIPT =
  (process.env.NEXT_PUBLIC_UNIT_SANDBOX !== "false" ? "https://ui.s.unit.sh" : "https://ui.unit.co") +
  "/release/latest/components-extended.js";

function BankingPageContent() {
  const { needsAuth0Login } = useUnitTokenAuth0();

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="dashboard-fade-in flex flex-col gap-1">
        {needsAuth0Login && (
          <p className="text-sm font-medium text-dashboard-text-muted">Sign in / Sign up</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Banking</h1>
        <p className="text-dashboard-text-muted text-sm">
          Manage your banking, payments, and financial activity.
        </p>
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-1 min-h-[600px]">
        <UnitElementsWrapper />
      </div>
    </div>
  );
}

function BankingPageDefault() {
  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="dashboard-fade-in flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Banking</h1>
        <p className="text-dashboard-text-muted text-sm">
          Manage your banking, payments, and financial activity.
        </p>
      </div>

      <div className="dashboard-fade-in dashboard-fade-in-delay-1 min-h-[600px]">
        <UnitElementsWrapper />
      </div>
    </div>
  );
}

export default function BankingPage() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = UNIT_SCRIPT;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  return USE_AUTH0 ? <BankingPageContent /> : <BankingPageDefault />;
}

"use client";

import { UnitElementsWrapper } from "@/components/unit";

export default function BankingPage() {
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

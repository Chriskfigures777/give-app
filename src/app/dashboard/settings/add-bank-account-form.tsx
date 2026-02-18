"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";

type Props = {
  publishableKey: string;
  /** Called after successfully adding. Defaults to window.location.reload() */
  onSuccess?: () => void;
  /** When true, form is expanded by default (e.g. when no accounts exist yet) */
  expandedByDefault?: boolean;
};

export function AddBankAccountForm({ publishableKey, onSuccess, expandedByDefault = false }: Props) {
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(expandedByDefault);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const stripe = await loadStripe(publishableKey);
      if (!stripe) throw new Error("Stripe failed to load");

      // @ts-expect-error - Stripe createToken bank_account overload; TS resolves to card element overload
      const { token, error: tokenError } = await stripe.createToken("bank_account", {
        country: "US",
        currency: "usd",
        routing_number: routingNumber.replace(/\D/g, ""),
        account_number: accountNumber.replace(/\D/g, ""),
        account_holder_name: accountHolderName || undefined,
      });

      if (tokenError) throw new Error(tokenError.message ?? "Failed to create token");
      if (!token?.id) throw new Error("No token returned");

      const res = await fetch("/api/connect/external-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankAccountToken: token.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add bank account");

      setRoutingNumber("");
      setAccountNumber("");
      setAccountHolderName("");
      setExpanded(false);
      (onSuccess ?? (() => window.location.reload()))();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add bank account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        {expanded ? "− Hide form" : (expandedByDefault ? "+ Add bank account" : "+ Add another bank account")}
      </button>
      {expanded && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {error && (
            <div className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Routing number</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={9}
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              placeholder="110000000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Account number</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="000123456789"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Account holder name <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-slate-500">
            Use test values in test mode: routing 110000000, account 000123456789.
          </p>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Adding…" : "Add bank account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpanded(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

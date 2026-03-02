"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExternalAccount = { id: string; bankName: string; last4: string; label: string };
type InternalSplit = { percentage: number; externalAccountId: string };

type Props = {
  organizationId: string;
};

export function InternalSplitsForm({ organizationId: _organizationId }: Props) {
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [internalSplits, setInternalSplits] = useState<InternalSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const refreshAccounts = useCallback(() => {
    return fetch("/api/connect/external-accounts")
      .then((r) => r.json())
      .then((d) => {
        if (d.accounts) setAccounts(d.accounts);
        if (d.internalSplits) setInternalSplits(d.internalSplits);
      });
  }, []);

  useEffect(() => {
    refreshAccounts()
      .catch(() => setError("Failed to load bank accounts"))
      .finally(() => setLoading(false));
  }, [refreshAccounts]);

  const addSplit = () => {
    setInternalSplits((s) => [...s, { percentage: 0, externalAccountId: accounts[0]?.id ?? "" }]);
  };

  const updateSplit = (idx: number, field: "percentage" | "externalAccountId", value: number | string) => {
    setInternalSplits((s) => {
      const next = [...s];
      next[idx] = { ...next[idx]!, [field]: value };
      return next;
    });
  };

  const removeSplit = (idx: number) => {
    setInternalSplits((s) => s.filter((_, i) => i !== idx));
  };

  const totalPercent = internalSplits.reduce((s, e) => s + (e.percentage ?? 0), 0);
  const isValid =
    totalPercent === 100 &&
    internalSplits.every((e) => e.externalAccountId && e.percentage > 0);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = internalSplits.map(({ percentage, externalAccountId }) => ({
        percentage,
        externalAccountId,
      }));
      const res = await fetch("/api/connect/internal-splits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalSplits: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading bank accounts…</p>;
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Add bank accounts (checking, savings, etc.) in{" "}
          <a href="/dashboard/connect/manage" className="text-emerald-600 hover:underline dark:text-emerald-400">
            Manage billing & payout account
          </a>
          . They will appear here automatically. Then configure how donations split across them.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            refreshAccounts().finally(() => setLoading(false));
          }}
        >
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Saved. Donations will be split to these accounts automatically.
        </div>
      )}

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Choose a bank account for each split and set the percentage. Must total 100%. Add more accounts in{" "}
        <a href="/dashboard/connect/manage" className="text-emerald-600 hover:underline dark:text-emerald-400">
          Manage billing & payout
        </a>
        —use &quot;Add another bank account&quot; at the bottom of that page—then refresh here.
      </p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bank account splits</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              refreshAccounts().finally(() => setLoading(false));
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSplit}
            disabled={accounts.length === 0}
          >
            <Plus className="h-3 w-3 mr-1" /> Add split
          </Button>
        </div>
      </div>

      {internalSplits.map((s, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-2 sm:items-center p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-800/30"
        >
          <div className="flex-1 min-w-0 space-y-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Bank account</label>
            <select
              value={s.externalAccountId}
              onChange={(e) => updateSplit(i, "externalAccountId", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">Select bank account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName} ****{a.last4}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-24">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Percentage</label>
            <input
              type="number"
              min={1}
              max={100}
              value={s.percentage || ""}
              onChange={(e) => updateSplit(i, "percentage", parseInt(e.target.value, 10) || 0)}
              placeholder="%"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeSplit(i)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Remove split"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {internalSplits.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Total: <strong className={totalPercent === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>{totalPercent}%</strong>
              {totalPercent !== 100 && " (must be 100%)"}
            </span>
          </div>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? "Saving…" : "Save splits"}
          </Button>
        </>
      )}

      {internalSplits.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            No splits configured. Click &quot;Add split&quot; to send a percentage of each donation to a specific bank account.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addSplit}>
            <Plus className="h-3 w-3 mr-1" /> Add split
          </Button>
        </div>
      )}
    </div>
  );
}

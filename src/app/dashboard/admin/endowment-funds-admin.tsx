"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Check, ExternalLink } from "lucide-react";

type EndowmentFund = {
  id: string;
  name: string;
  description: string | null;
  stripe_connect_account_id: string | null;
  created_at: string | null;
};

type Props = {
  initialFunds: EndowmentFund[];
};

export function EndowmentFundsAdmin({ initialFunds }: Props) {
  const [funds, setFunds] = useState<EndowmentFund[]>(initialFunds);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [createConnect, setCreateConnect] = useState(true);

  async function fetchFunds() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/endowment-funds");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFunds(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFunds();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/endowment-funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          createConnectAccount: createConnect,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setFunds((prev) => [...prev, data]);
      setNewName("");
      setNewDesc("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateConnect(fundId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/endowment-funds/${fundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createConnectAccount: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create Connect account");
      setFunds((prev) =>
        prev.map((f) =>
          f.id === fundId
            ? { ...f, stripe_connect_account_id: data.stripe_connect_account_id }
            : f
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="General Endowment Fund"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Receives 30% of platform fees"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={createConnect}
              onChange={(e) => setCreateConnect(e.target.checked)}
              className="rounded border-slate-300"
            />
            Create Connect account
          </label>
        </div>
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create fund
        </button>
      </form>

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Existing funds</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : funds.length === 0 ? (
          <p className="text-sm text-slate-500">No endowment funds yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {funds.map((fund) => (
              <li
                key={fund.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{fund.name}</p>
                  {fund.description && (
                    <p className="text-sm text-slate-500">{fund.description}</p>
                  )}
                  {fund.stripe_connect_account_id ? (
                    <p className="mt-1 text-xs text-emerald-600">
                      <Check className="mr-1 inline h-3 w-3" />
                      Connect account linked
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-600">
                      No Connect account — transfers will not work
                    </p>
                  )}
                </div>
                {!fund.stripe_connect_account_id && (
                  <button
                    type="button"
                    onClick={() => handleCreateConnect(fund.id)}
                    className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    Create Connect account
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

type Domain = {
  id: string;
  domain: string;
  status: string;
  verified_at: string | null;
  created_at: string | null;
};

type Props = {
  organizationId: string;
};

export function CustomDomainsForm({ organizationId }: Props) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<{
    domainId: string;
    name: string;
    value: string;
    message: string;
  } | null>(null);

  const fetchDomains = useCallback(() => {
    return fetch(
      `/api/organization-website/domains?organizationId=${encodeURIComponent(organizationId)}`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.domains) setDomains(d.domains);
      });
  }, [organizationId]);

  useEffect(() => {
    fetchDomains()
      .catch(() => setError("Failed to load domains"))
      .finally(() => setLoading(false));
  }, [fetchDomains]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0];
    if (!domain || !domain.includes(".")) {
      setError("Enter a valid domain (e.g. www.example.org)");
      return;
    }
    setAdding(true);
    setError(null);
    setInstructions(null);
    try {
      const res = await fetch("/api/organization-website/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ organizationId, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add domain");
      setNewDomain("");
      await fetchDomains();
      if (data.domain && data.instructions) {
        setInstructions({
          domainId: data.domain.id,
          name: data.instructions.name,
          value: data.instructions.value,
          message: data.instructions.message,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add domain");
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifying(domainId);
    setError(null);
    try {
      const res = await fetch("/api/organization-website/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ organizationId, domainId, tryRoute53: true }),
      });
      const data = await res.json();
      if (data.verified) {
        await fetchDomains();
        setInstructions(null);
      } else {
        setError(data.error ?? "Verification failed. Add the CNAME record and try again.");
      }
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(null);
    }
  };

  const handleRemove = async (domainId: string) => {
    setRemoving(domainId);
    setError(null);
    try {
      const res = await fetch(
        `/api/organization-website/domains?domainId=${encodeURIComponent(domainId)}&organizationId=${encodeURIComponent(organizationId)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to remove");
      }
      await fetchDomains();
      if (instructions?.domainId === domainId) setInstructions(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading domains...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add domain form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="www.yourchurch.org"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
        />
        <button
          type="submit"
          disabled={adding}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Connect
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/60 p-3.5 dark:border-red-800/40 dark:bg-red-900/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* DNS Instructions */}
      {instructions && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                DNS configuration required
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">{instructions.message}</p>
              <div className="flex items-center gap-2 rounded-lg bg-amber-100/80 p-2.5 dark:bg-amber-900/30">
                <code className="flex-1 truncate text-xs font-mono text-amber-900 dark:text-amber-200">
                  {instructions.name} → {instructions.value}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(`${instructions.name} → ${instructions.value}`)}
                  className="shrink-0 rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-200/60 dark:text-amber-400 dark:hover:bg-amber-800/50"
                >
                  {copiedValue === `${instructions.name} → ${instructions.value}` ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleVerify(instructions.domainId)}
                disabled={verifying === instructions.domainId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                {verifying === instructions.domainId ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Verify DNS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain list */}
      {domains.length > 0 && (
        <div className="space-y-2">
          {domains.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/40 px-4 py-3 transition-all duration-200 hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-800/30 dark:hover:border-slate-600"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {d.domain}
                </span>
                {d.status === "verified" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <CheckCircle className="h-2.5 w-2.5" />
                    Verified
                  </span>
                ) : d.status === "failed" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-400">
                    <XCircle className="h-2.5 w-2.5" />
                    Failed
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    Pending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {d.status !== "verified" && (
                  <button
                    type="button"
                    onClick={() => handleVerify(d.id)}
                    disabled={verifying === d.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {verifying === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(d.id)}
                  disabled={removing === d.id}
                  className="inline-flex items-center rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Remove domain"
                >
                  {removing === d.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {domains.length === 0 && !instructions && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 py-5 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <Globe className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            No custom domains yet
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Connect one above to use your own URL
          </p>
        </div>
      )}
    </div>
  );
}

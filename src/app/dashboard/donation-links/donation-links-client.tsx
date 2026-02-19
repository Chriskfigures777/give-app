"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrgPlan } from "@/lib/plan";

type SplitEntry = { percentage: number; accountId?: string; splitBankAccountId?: string };
type DonationLink = { id: string; name: string; slug: string; splits: SplitEntry[]; split_mode?: string; created_at: string };
type Org = { id: string; name: string; slug: string; stripe_connect_account_id: string };

type Props = {
  donationLinks: DonationLink[];
  organizations: Org[];
  organizationSlug: string;
  baseUrl: string;
  formLimit: number;
  currentPlan: OrgPlan;
};

export function DonationLinksClient({ donationLinks, organizations, organizationSlug, baseUrl, formLimit, currentPlan }: Props) {
  const [links, setLinks] = useState(donationLinks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [splits, setSplits] = useState<SplitEntry[]>([]);

  const addSplit = () => {
    setSplits((s) => [...s, { percentage: 0, accountId: "" }]);
  };

  const updateSplit = (idx: number, field: "percentage" | "accountId", value: number | string) => {
    setSplits((s) => {
      const next = [...s];
      next[idx] = { ...next[idx]!, [field]: value };
      return next;
    });
  };

  const removeSplit = (idx: number) => {
    setSplits((s) => s.filter((_, i) => i !== idx));
  };

  const totalPercent = splits.reduce((sum, e) => sum + (e.percentage ?? 0), 0);
  const isValid =
    name.trim() &&
    slug.trim() &&
    totalPercent === 100 &&
    splits.every((e) => e.accountId && e.percentage > 0);

  const handleCreate = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/donation-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          splits: splits.map((s) => ({ percentage: s.percentage, accountId: s.accountId })),
          split_mode: "stripe_connect",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setLinks((prev) => [data.donationLink, ...prev]);
      setShowForm(false);
      setName("");
      setSlug("");
      setSplits([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this donation link?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/donation-links/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const getSplitLabel = (entry: SplitEntry) => {
    if (entry.accountId) {
      const o = organizations.find((x) => x.stripe_connect_account_id === entry.accountId);
      return o?.name ?? entry.accountId;
    }
    return entry.splitBankAccountId ? "Legacy bank account" : "";
  };

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto overflow-x-hidden">
      <div className="grid grid-cols-1 gap-6 px-4 py-6">
        <header className="dashboard-fade-in min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">Donation links</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Create donation links that split funds across multiple organizations. When donors give through a link, the webhook automatically splits the payment. You can only split to connected peers—go to{" "}
            <Link href="/dashboard/connections" className="text-emerald-500 hover:underline">
              Connections
            </Link>{" "}
            to connect with organizations first.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-dashboard-text">Your donation links</h2>
              <p className="text-xs text-dashboard-text-muted mt-0.5">
                {links.length} / {formLimit === Infinity ? "∞" : formLimit} forms used
                {formLimit !== Infinity && links.length >= formLimit && (
                  <span className="text-amber-500 ml-1">— limit reached</span>
                )}
              </p>
            </div>
            {formLimit !== Infinity && links.length >= formLimit ? (
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                Upgrade for more
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Button
                onClick={() => setShowForm(!showForm)}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create link
              </Button>
            )}
          </div>

          {showForm && (
            <div className="mb-6 p-4 rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Community Fund"
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-dashboard-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-1">Slug (URL-safe)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. community-fund"
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-dashboard-text"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-dashboard-text">Splits (must total 100%)</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSplit}
                    disabled={organizations.length === 0}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {organizations.length === 0 && (
                  <p className="text-sm text-amber-500 mb-2">
                    No connected peers with Stripe Connect yet. Go to{" "}
                    <Link href="/dashboard/connections" className="text-emerald-500 hover:underline">
                      Connections
                    </Link>{" "}
                    to search and connect with organizations you want to split funds to.
                  </p>
                )}
                {splits.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select
                      value={s.accountId ?? ""}
                      onChange={(e) => updateSplit(i, "accountId", e.target.value)}
                      className="flex-1 rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-dashboard-text"
                    >
                      <option value="">Select organization</option>
                      {organizations.map((o) => (
                        <option key={o.id} value={o.stripe_connect_account_id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={s.percentage || ""}
                      onChange={(e) => updateSplit(i, "percentage", parseInt(e.target.value, 10) || 0)}
                      placeholder="%"
                      className="w-20 rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-dashboard-text"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSplit(i)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))}
                {splits.length > 0 && (
                  <p className="text-sm text-dashboard-text-muted mt-1">
                    Total: {totalPercent}% {totalPercent !== 100 && "(must be 100%)"}
                  </p>
                )}
              </div>
              <Button onClick={handleCreate} disabled={!isValid || loading} className="bg-emerald-600 hover:bg-emerald-700">
                Create donation link
              </Button>
            </div>
          )}

          {links.length === 0 ? (
            <p className="text-dashboard-text-muted">No donation links yet. Create one to split funds across organizations.</p>
          ) : (
            <ul className="space-y-3">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="flex items-center justify-between rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-medium text-dashboard-text">{link.name}</p>
                      <p className="text-sm text-dashboard-text-muted">
                        /give/{organizationSlug}?link={link.slug}
                      </p>
                      <p className="text-xs text-dashboard-text-muted mt-1">
                        Splits: {link.splits.map((s) => `${getSplitLabel(s)} ${s.percentage}%`).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${baseUrl}/give/${organizationSlug}?link=${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-500 hover:underline"
                    >
                      Open link
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(link.id)}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

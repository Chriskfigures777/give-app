"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "website", label: "Website ($35/mo)" },
  { value: "pro", label: "Pro ($49/mo)" },
];

const PLAN_STATUS_OPTIONS = [
  { value: "", label: "— None —" },
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past due" },
  { value: "canceled", label: "Canceled" },
];

type Props = {
  orgId: string;
  initialName: string;
  initialSlug: string;
  initialPlan: string;
  initialPlanStatus: string;
};

export function OrgAccountEditor({ orgId, initialName, initialSlug, initialPlan, initialPlanStatus }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [plan, setPlan] = useState(initialPlan || "free");
  const [planStatus, setPlanStatus] = useState(initialPlanStatus || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, plan, plan_status: planStatus || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save changes");
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">
            Organization name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-2.5 text-sm text-dashboard-text focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">
            Slug (URL)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            className="w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-2.5 text-sm text-dashboard-text font-mono focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">
            Plan
          </label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-2.5 text-sm text-dashboard-text focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted mb-1.5">
            Plan status
          </label>
          <select
            value={planStatus}
            onChange={(e) => setPlanStatus(e.target.value)}
            className="w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-2.5 text-sm text-dashboard-text focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          >
            {PLAN_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Saved!</span>
        )}
      </div>
    </div>
  );
}

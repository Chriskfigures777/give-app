"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  goal_amount_cents?: number | null;
  current_amount_cents?: number | null;
  goal_deadline?: string | null;
};

type Props = {
  campaigns: Campaign[];
};

export function CampaignsEditor({ campaigns }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (c: Campaign) => {
    setEditingId(c.id);
    setGoalAmount(c.goal_amount_cents != null ? String(c.goal_amount_cents / 100) : "");
    setGoalDeadline(c.goal_deadline ? c.goal_deadline.slice(0, 16) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/donation-campaigns/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_amount_cents: goalAmount ? Math.round(parseFloat(goalAmount) * 100) : null,
          goal_deadline: goalDeadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      router.refresh();
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
        Set goal amounts and deadlines for campaigns. Required for goal-style embed cards. Create campaigns in{" "}
        <Link href="/dashboard/goals" className="font-medium text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">Goals</Link>.
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/30 px-4 py-2.5">
          <p className="text-[12px] text-red-600 dark:text-red-400" role="alert">{error}</p>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/[0.08] dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-800/20 p-8 text-center">
          <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">No campaigns yet</p>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-5">Create a campaign to set donation goals.</p>
          <Link
            href="/dashboard/goals"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-600 transition-colors shadow-sm"
          >
            Create campaign
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-slate-50/50 dark:bg-slate-800/20 p-4 transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{c.name}</span>
                {editingId === c.id ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                      className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] px-3.5 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] px-3.5 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingId === c.id ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Goal amount (USD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-800/50 px-3.5 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Goal deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                      className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-800/50 px-3.5 py-2.5 text-[13px] text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-[12px] text-slate-400 dark:text-slate-500">
                  {c.goal_amount_cents != null && c.goal_amount_cents > 0 ? (
                    <>
                      Goal: ${(Number(c.goal_amount_cents) / 100).toLocaleString()}
                      {c.goal_deadline && (
                        <> &middot; By {new Date(c.goal_deadline).toLocaleDateString()}</>
                      )}
                    </>
                  ) : (
                    "No goal set"
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

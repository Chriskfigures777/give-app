"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Campaign = {
  id: string;
  name: string;
  description?: string | null;
  goal_amount_cents?: number | null;
  current_amount_cents?: number | null;
  goal_deadline?: string | null;
  is_active?: boolean | null;
};

type Props = {
  campaigns: Campaign[];
};

export function GoalsClient({ campaigns }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setGoalAmount("");
    setGoalDeadline("");
    setError(null);
    setCreating(false);
    setEditingId(null);
  };

  const startCreate = () => {
    setName("");
    setDescription("");
    setGoalAmount("");
    setGoalDeadline("");
    setError(null);
    setCreating(true);
  };

  const startEdit = (c: Campaign) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description ?? "");
    setGoalAmount(c.goal_amount_cents != null ? String(c.goal_amount_cents / 100) : "");
    setGoalDeadline(c.goal_deadline ? c.goal_deadline.slice(0, 16) : "");
    setError(null);
  };

  const cancelEdit = () => resetForm();

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/donation-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          goal_amount_cents: goalAmount ? Math.round(parseFloat(goalAmount) * 100) : null,
          goal_deadline: goalDeadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      router.refresh();
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
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
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const isOpen = creating || !!editingId;

  return (
    <section className="dashboard-fade-in rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-bold text-dashboard-text">Financial goals</h2>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
        >
          <Plus className="h-4 w-4" />
          Create campaign
        </button>
      </div>

      <p className="text-sm text-dashboard-text-muted mb-4">
        Campaigns let you track progress toward specific fundraising goals. Create a campaign, set a goal amount, then select it when creating embed cards to show a progress bar.
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-dashboard-border bg-dashboard-card-hover/30 p-8 text-center">
          <p className="text-sm font-medium text-dashboard-text mb-2">No campaigns yet</p>
          <p className="text-sm text-dashboard-text-muted mb-4">
            Create your first campaign to use goals in your embedded donation forms.
          </p>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Create campaign
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-dashboard-border p-4 bg-dashboard-card-hover/30"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-dashboard-text">{c.name}</span>
                  {c.description && (
                    <p className="mt-0.5 text-sm text-dashboard-text-muted truncate">{c.description}</p>
                  )}
                  <div className="mt-2 text-sm text-dashboard-text-muted">
                    {c.goal_amount_cents != null && c.goal_amount_cents > 0 ? (
                      <>
                        Goal: ${(Number(c.goal_amount_cents) / 100).toLocaleString()}
                        {c.current_amount_cents != null && (
                          <> · Raised: ${(Number(c.current_amount_cents) / 100).toLocaleString()}</>
                        )}
                        {c.goal_deadline && (
                          <> · By {new Date(c.goal_deadline).toLocaleDateString()}</>
                        )}
                      </>
                    ) : (
                      "No goal set"
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="shrink-0 rounded-lg border border-dashboard-border px-3 py-1.5 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) cancelEdit(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{creating ? "Create campaign" : "Edit campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Building fund 2025"
                disabled={!!editingId}
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>
            {creating && (
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the campaign"
                  rows={2}
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Goal amount (USD)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Goal deadline (optional)</label>
              <input
                type="datetime-local"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-dashboard-border px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={creating ? handleCreate : handleUpdate}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : creating ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

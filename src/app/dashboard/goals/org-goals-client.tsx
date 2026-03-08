"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flag, Plus, Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type OrgGoal = {
  id: string;
  name: string;
  description?: string | null;
  access: string;
  end_date?: string | null;
  start_date?: string | null;
  target_value?: number | null;
  target_unit?: string | null;
  owner_user_ids?: string[];
  created_at: string;
  updated_at: string;
};

type GoalUpdate = {
  id: string;
  goal_id: string;
  value_number?: number | null;
  value_text?: string | null;
  note?: string | null;
  recorded_at: string;
  created_at: string;
};

/** Current progress = latest update's value_number (total as of that date). */
function getCurrentValue(updates: GoalUpdate[]): number | null {
  if (!updates.length) return null;
  const sorted = [...updates].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  const v = sorted[0]?.value_number;
  return v != null ? Number(v) : null;
}

export function OrgGoalsClient() {
  const router = useRouter();
  const [goals, setGoals] = useState<OrgGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalAccess, setGoalAccess] = useState<"workspace" | "private">("workspace");
  const [goalEndDate, setGoalEndDate] = useState("");
  const [goalTargetValue, setGoalTargetValue] = useState("");
  const [goalTargetUnit, setGoalTargetUnit] = useState("");
  const [goalOwner, setGoalOwner] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [detailModalGoalId, setDetailModalGoalId] = useState<string | null>(null);
  const [updatesByGoal, setUpdatesByGoal] = useState<Record<string, GoalUpdate[]>>({});
  const [updateValue, setUpdateValue] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [updateRecordedAt, setUpdateRecordedAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [updateSaving, setUpdateSaving] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/org-goals");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to load goals");
      }
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (e) {
      setGoals([]);
      setError(e instanceof Error ? e.message : "Failed to load goals");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGoals().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchGoals]);

  useEffect(() => {
    if (!detailModalGoalId) return;
    fetch(`/api/org-goals/${detailModalGoalId}/updates`)
      .then((r) => r.json())
      .then((data) => {
        setUpdatesByGoal((prev) => ({
          ...prev,
          [detailModalGoalId]: Array.isArray(data) ? data : [],
        }));
      })
      .catch(() => setUpdatesByGoal((prev) => ({ ...prev, [detailModalGoalId]: [] })));
  }, [detailModalGoalId]);

  const openCreateGoal = () => {
    setEditingGoalId(null);
    setGoalName("");
    setGoalDescription("");
    setGoalAccess("workspace");
    setGoalEndDate("");
    setGoalTargetValue("");
    setGoalTargetUnit("");
    setGoalOwner("");
    setGoalError(null);
    setGoalDialogOpen(true);
  };

  const openEditGoal = (g: OrgGoal) => {
    setEditingGoalId(g.id);
    setGoalName(g.name);
    setGoalDescription(g.description ?? "");
    setGoalAccess((g.access as "workspace" | "private") || "workspace");
    setGoalEndDate(g.end_date ? g.end_date.slice(0, 10) : "");
    setGoalTargetValue(g.target_value != null ? String(g.target_value) : "");
    setGoalTargetUnit(g.target_unit ?? "");
    setGoalOwner("");
    setGoalError(null);
    setGoalDialogOpen(true);
  };

  const saveGoal = async () => {
    if (!goalName.trim()) {
      setGoalError("Goal name is required");
      return;
    }
    setGoalSaving(true);
    setGoalError(null);
    try {
      const url = editingGoalId ? `/api/org-goals/${editingGoalId}` : "/api/org-goals";
      const method = editingGoalId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name: goalName.trim(),
        description: goalDescription.trim() || null,
        access: goalAccess,
        end_date: goalEndDate || null,
        target_value: goalTargetValue ? Number(goalTargetValue) : null,
        target_unit: goalTargetUnit.trim() || null,
      };
      if (!editingGoalId) body.owner_user_ids = [];
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      router.refresh();
      await fetchGoals();
      setGoalDialogOpen(false);
    } catch (e) {
      setGoalError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setGoalSaving(false);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Delete this goal and all its updates?")) return;
    try {
      const res = await fetch(`/api/org-goals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to delete");
      }
      router.refresh();
      await fetchGoals();
      if (detailModalGoalId === id) setDetailModalGoalId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const addUpdate = async (goalId: string) => {
    const valueNum = updateValue.trim() ? Number(updateValue) : null;
    if (valueNum === null && !updateNote.trim()) return;
    setUpdateSaving(true);
    try {
      const res = await fetch(`/api/org-goals/${goalId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value_number: valueNum,
          value_text: updateValue.trim() || null,
          note: updateNote.trim() || null,
          recorded_at: updateRecordedAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add update");
      setUpdatesByGoal((prev) => ({
        ...prev,
        [goalId]: [data, ...(prev[goalId] ?? [])],
      }));
      setUpdateValue("");
      setUpdateNote("");
      setUpdateRecordedAt(new Date().toISOString().slice(0, 10));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add update");
    } finally {
      setUpdateSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-fade-in rounded-2xl border border-dashboard-border bg-dashboard-card p-8 text-center">
        <p className="text-sm text-dashboard-text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <section className="dashboard-fade-in rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-sm min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-bold text-dashboard-text">90-day rocks</h2>
        </div>
        <button
          type="button"
          onClick={openCreateGoal}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
        >
          <Plus className="h-4 w-4" />
          Create goal
        </button>
      </div>
      <p className="text-sm text-dashboard-text-muted mb-4">
        Set goals (e.g. 1,000 members, 25 active members) and add weekly progress. Enter the <strong>current total</strong> each week (e.g. 10, then 23, then 37 new members). The bar shows where you are. When new members are added in People, we can automatically update member-count goals (coming soon).
      </p>
      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-dashboard-border bg-dashboard-card-hover/30 p-8 text-center">
          <p className="text-sm font-medium text-dashboard-text mb-2">No goals yet</p>
          <p className="text-sm text-dashboard-text-muted mb-4">
            Create your first 90-day rock. Set a target (e.g. 1,000 members or 25 active members who attend 2–3x/month and complete surveys) and log weekly updates.
          </p>
          <button
            type="button"
            onClick={openCreateGoal}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Create goal
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {goals.map((g) => {
            const updates = updatesByGoal[g.id] ?? [];
            const current = getCurrentValue(updates);
            const target = g.target_value != null ? Number(g.target_value) : null;
            const unit = g.target_unit ?? "units";
            const percent =
              target != null && target > 0 && current != null
                ? Math.min(100, (current / target) * 100)
                : 0;
            return (
              <li
                key={g.id}
                className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 overflow-hidden"
              >
                <div
                  className="flex items-center gap-2 p-4 cursor-pointer hover:bg-dashboard-card-hover/50"
                  onClick={() => setDetailModalGoalId(g.id)}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-dashboard-text">{g.name}</span>
                    {(target != null || g.end_date) && (
                      <p className="mt-0.5 text-sm text-dashboard-text-muted">
                        {target != null && (
                          <>
                            Target: {target.toLocaleString()} {unit}
                          </>
                        )}
                        {target != null && g.end_date && " · "}
                        {g.end_date && <>By {new Date(g.end_date).toLocaleDateString()}</>}
                      </p>
                    )}
                    {target != null && target > 0 && (
                      <div className="mt-2">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {current != null ? current.toLocaleString() : "0"} of {target.toLocaleString()} {unit}
                          </span>
                          {current != null && (
                            <span className="text-dashboard-text-muted">{percent.toFixed(0)}%</span>
                          )}
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-dashboard-card-hover/50">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openEditGoal(g)}
                      className="rounded-lg border border-dashboard-border px-2 py-1.5 text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text"
                      title="Edit goal"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGoal(g.id)}
                      className="rounded-lg border border-dashboard-border px-2 py-1.5 text-dashboard-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Goal detail modal: progress bar + add weekly update */}
      {(() => {
        const g = detailModalGoalId ? goals.find((x) => x.id === detailModalGoalId) : null;
        if (!g) return null;
        const updates = updatesByGoal[g.id] ?? [];
        const current = getCurrentValue(updates);
        const target = g.target_value != null ? Number(g.target_value) : null;
        const unit = g.target_unit ?? "units";
        const percent =
          target != null && target > 0 && current != null
            ? Math.min(100, (current / target) * 100)
            : 0;
        return (
          <Dialog open={!!detailModalGoalId} onOpenChange={(open) => !open && setDetailModalGoalId(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader className="flex flex-row items-start justify-between gap-4">
                <DialogTitle className="pr-8">{g.name}</DialogTitle>
                <div className="flex gap-1 -mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalGoalId(null);
                      openEditGoal(g);
                    }}
                    className="rounded-lg border border-dashboard-border px-2 py-1.5 text-dashboard-text-muted hover:bg-dashboard-card-hover"
                    title="Edit goal"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalGoalId(null);
                      deleteGoal(g.id);
                    }}
                    className="rounded-lg border border-dashboard-border px-2 py-1.5 text-dashboard-text-muted hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </DialogHeader>
              {g.description && (
                <p className="text-sm text-dashboard-text-muted -mt-2">{g.description}</p>
              )}
              {target != null && target > 0 && (
                <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 p-4">
                  <div className="flex items-baseline justify-between gap-2 text-sm mb-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {current != null ? current.toLocaleString() : "0"} of {target.toLocaleString()} {unit}
                    </span>
                    {current != null && (
                      <span className="text-dashboard-text-muted">{percent.toFixed(0)}%</span>
                    )}
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-dashboard-card-hover/50">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-dashboard-text">Add this week&apos;s progress</h4>
                <p className="text-xs text-dashboard-text-muted">
                  Enter the current total (e.g. 10 staff read the Bible this week, or 20 times total so far).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={target != null ? `Current total (e.g. ${unit})` : "Value or note"}
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    className="rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
                  />
                  <input
                    type="date"
                    value={updateRecordedAt}
                    onChange={(e) => setUpdateRecordedAt(e.target.value)}
                    className="rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
                  />
                </div>
                <textarea
                  placeholder="Note (optional)"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
                />
                <button
                  type="button"
                  onClick={() => addUpdate(g.id)}
                  disabled={updateSaving || (!updateValue.trim() && !updateNote.trim())}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {updateSaving ? "Saving…" : "Save update"}
                </button>
              </div>
              <div className="border-t border-dashboard-border pt-3 mt-3">
                <h4 className="text-sm font-medium text-dashboard-text mb-2">Past updates</h4>
                {updates.length === 0 ? (
                  <p className="text-sm text-dashboard-text-muted">No updates yet. Add one above.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {updates.map((u) => (
                      <li
                        key={u.id}
                        className="flex items-center justify-between text-sm py-1.5 border-b border-dashboard-border/50 last:border-0"
                      >
                        <span className="text-dashboard-text">
                          {u.value_number != null && (
                            <strong>{u.value_number.toLocaleString()}</strong>
                          )}
                          {u.value_text && <span className="ml-1">{u.value_text}</span>}
                          {u.note && (
                            <span className="text-dashboard-text-muted ml-1">— {u.note}</span>
                          )}
                        </span>
                        <span className="text-dashboard-text-muted text-xs shrink-0 ml-2">
                          {new Date(u.recorded_at).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoalId ? "Edit goal" : "Create goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">
                Goal name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. 1,000 members or 25 active members"
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Owner (optional)</label>
              <input
                type="text"
                value={goalOwner}
                onChange={(e) => setGoalOwner(e.target.value)}
                placeholder="Who is responsible?"
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Who has access?</label>
              <select
                value={goalAccess}
                onChange={(e) => setGoalAccess(e.target.value as "workspace" | "private")}
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
              >
                <option value="workspace">Workspace (everyone in org)</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">
                End date (optional)
              </label>
              <input
                type="date"
                value={goalEndDate}
                onChange={(e) => setGoalEndDate(e.target.value)}
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-1">Target (optional)</label>
                <input
                  type="text"
                  value={goalTargetValue}
                  onChange={(e) => setGoalTargetValue(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dashboard-text mb-1">Unit (optional)</label>
                <input
                  type="text"
                  value={goalTargetUnit}
                  onChange={(e) => setGoalTargetUnit(e.target.value)}
                  placeholder="e.g. members, dollars"
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">
                Description (optional)
              </label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="e.g. Active = 2–3x/month, complete surveys, engage with content after preaching"
                rows={3}
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {goalError && (
              <p className="text-sm text-red-600" role="alert">
                {goalError}
              </p>
            )}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setGoalDialogOpen(false)}
                className="rounded-lg border border-dashboard-border px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveGoal}
                disabled={goalSaving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {goalSaving ? "Saving…" : editingGoalId ? "Save" : "Create"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

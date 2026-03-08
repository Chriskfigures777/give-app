"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type EisenhowerItem = {
  id: string;
  quadrant: number;
  title: string;
  content?: string | null;
  position_x: number;
  position_y: number;
  color: string;
};

const QUADRANT_LABELS: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Do it now", subtitle: "Urgent & Important" },
  2: { title: "Schedule for later", subtitle: "Not Urgent & Important" },
  3: { title: "Delegate", subtitle: "Urgent & Not Important" },
  4: { title: "Eliminate or ignore", subtitle: "Not Urgent & Not Important" },
};

const STICKY_COLORS = ["#fef08a", "#bbf7d0", "#fed7aa", "#e9d5ff", "#bfdbfe"];

export function EisenhowerWhiteboardClient() {
  const router = useRouter();
  const [items, setItems] = useState<EisenhowerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [quadrant, setQuadrant] = useState(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(STICKY_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/eisenhower");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openAdd = (q: number) => {
    setQuadrant(q);
    setTitle("");
    setContent("");
    setColor(STICKY_COLORS[0]);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (item: EisenhowerItem) => {
    setEditingId(item.id);
    setQuadrant(item.quadrant);
    setTitle(item.title);
    setContent(item.content ?? "");
    setColor(item.color);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/eisenhower/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quadrant,
            title: title.trim(),
            content: content.trim() || null,
            color,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "Failed to update");
        }
      } else {
        const res = await fetch("/api/eisenhower", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quadrant,
            title: title.trim(),
            content: content.trim() || null,
            color,
            position_x: 0,
            position_y: 0,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "Failed to create");
        }
      }
      router.refresh();
      await fetchItems();
      setDialogOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this item?")) return;
    try {
      const res = await fetch(`/api/eisenhower/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to delete");
      }
      router.refresh();
      await fetchItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
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
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="h-5 w-5 text-violet-600" />
        <h2 className="text-base font-bold text-dashboard-text">Priorities</h2>
      </div>
      <p className="text-sm text-dashboard-text-muted mb-6">
        Put tasks in the right box: <strong>important + urgent</strong> first, then schedule or delegate the rest. Get things in order so you know what to do now vs later.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((q) => (
          <div
            key={q}
            className="rounded-xl border-2 border-dashboard-border bg-dashboard-card-hover/20 p-4 min-h-[200px]"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-dashboard-text">
                  {QUADRANT_LABELS[q].title}
                </h3>
                <p className="text-xs text-dashboard-text-muted">
                  {QUADRANT_LABELS[q].subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAdd(q)}
                className="rounded-lg border border-dashboard-border px-2 py-1 text-xs font-medium text-dashboard-text hover:bg-dashboard-card-hover"
              >
                <Plus className="h-3.5 w-3.5 inline mr-1" />
                Add
              </button>
            </div>
            <ul className="space-y-2">
              {items
                .filter((i) => i.quadrant === q)
                .map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-start gap-2 rounded-lg p-2 border border-dashboard-border/50"
                    style={{ borderLeftColor: item.color, borderLeftWidth: 4 }}
                  >
                    <div className="min-w-0 flex-1">
                      {item.title && (
                        <p className="text-sm font-medium text-dashboard-text">{item.title}</p>
                      )}
                      {item.content && (
                        <p className="text-xs text-dashboard-text-muted mt-0.5">{item.content}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded p-1 text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="rounded p-1 text-dashboard-text-muted hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit item" : "Add to whiteboard"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Quadrant</label>
              <select
                value={quadrant}
                onChange={(e) => setQuadrant(Number(e.target.value))}
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>
                    {QUADRANT_LABELS[q].title} — {QUADRANT_LABELS[q].subtitle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short title"
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Content (optional)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Details"
                rows={2}
                className="w-full rounded-lg border border-dashboard-border bg-dashboard-card px-3 py-2 text-sm text-dashboard-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dashboard-text mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "var(--dashboard-text)" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg border border-dashboard-border px-4 py-2 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Save" : "Add"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

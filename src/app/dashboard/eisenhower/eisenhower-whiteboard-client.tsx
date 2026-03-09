"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, Plus, Pencil, Trash2, Zap, Clock,
  Users, Archive, X, Sparkles, ChevronDown,
} from "lucide-react";
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

const QUADRANTS = [
  {
    id: 1,
    title: "Do It Now",
    subtitle: "Urgent & Important",
    icon: Zap,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.25)",
    badge: "bg-red-500/15 text-red-400",
    glow: "rgba(239,68,68,0.12)",
    tag: "🔴 Critical",
  },
  {
    id: 2,
    title: "Schedule It",
    subtitle: "Not Urgent & Important",
    icon: Clock,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.25)",
    badge: "bg-blue-500/15 text-blue-400",
    glow: "rgba(59,130,246,0.12)",
    tag: "📅 Plan",
  },
  {
    id: 3,
    title: "Delegate",
    subtitle: "Urgent & Not Important",
    icon: Users,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.25)",
    badge: "bg-amber-500/15 text-amber-400",
    glow: "rgba(245,158,11,0.12)",
    tag: "🤝 Delegate",
  },
  {
    id: 4,
    title: "Eliminate",
    subtitle: "Not Urgent & Not Important",
    icon: Archive,
    color: "#6b7280",
    bg: "rgba(107,114,128,0.07)",
    border: "rgba(107,114,128,0.25)",
    badge: "bg-gray-500/15 text-gray-400",
    glow: "rgba(107,114,128,0.08)",
    tag: "🗑 Drop",
  },
];

const ITEM_COLORS = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

export function EisenhowerWhiteboardClient() {
  const router = useRouter();
  const [items, setItems] = useState<EisenhowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quadrant, setQuadrant] = useState(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(ITEM_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/eisenhower");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd = (q: number) => {
    setQuadrant(q);
    setTitle(""); setContent("");
    setColor(ITEM_COLORS[QUADRANTS.findIndex((x) => x.id === q) % ITEM_COLORS.length]);
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

  const moveItem = async (id: string, newQ: number) => {
    setMovingId(id);
    try {
      const res = await fetch(`/api/eisenhower/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quadrant: newQ }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setMovingId(null);
    }
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/eisenhower/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quadrant, title: title.trim(), content: content.trim() || null, color }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      } else {
        const res = await fetch("/api/eisenhower", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quadrant, title: title.trim(), content: content.trim() || null, color, position_x: 0, position_y: 0 }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
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
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      router.refresh();
      await fetchItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const totalItems = items.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm text-dashboard-text-muted">Loading priorities…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 dashboard-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4 text-violet-400" />
            </div>
            <h1 className="text-2xl font-black text-dashboard-text tracking-tight">Priorities</h1>
            {totalItems > 0 && (
              <span className="rounded-full bg-violet-500/15 text-violet-400 text-xs font-bold px-2.5 py-0.5">
                {totalItems}
              </span>
            )}
          </div>
          <p className="text-sm text-dashboard-text-muted">
            Sort tasks by urgency and importance to focus on what actually moves the needle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAdd(1)}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-[.98]"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Matrix Legend */}
      <div className="grid grid-cols-2 gap-2 dashboard-fade-in-delay-1">
        <div className="rounded-xl p-3 text-center text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="font-bold text-dashboard-text mb-0.5">Urgent</div>
          <div className="text-dashboard-text-muted">Needs action soon</div>
        </div>
        <div className="rounded-xl p-3 text-center text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="font-bold text-dashboard-text mb-0.5">Important</div>
          <div className="text-dashboard-text-muted">High value, long-term impact</div>
        </div>
      </div>

      {/* 2×2 Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 dashboard-fade-in-delay-2">
        {QUADRANTS.map((q) => {
          const qItems = items.filter((i) => i.quadrant === q.id);
          const Icon = q.icon;
          return (
            <div
              key={q.id}
              className="relative rounded-2xl p-4 flex flex-col min-h-[240px] transition-all duration-300"
              style={{
                background: q.bg,
                border: `1.5px solid ${q.border}`,
              }}
            >
              {/* Quadrant header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: q.color + "20", border: `1px solid ${q.color}35` }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: q.color, width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-dashboard-text leading-tight">{q.title}</h3>
                    <p className="text-xs text-dashboard-text-muted">{q.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {qItems.length > 0 && (
                    <span
                      className="rounded-full text-xs font-bold px-2 py-0.5"
                      style={{ background: q.color + "20", color: q.color }}
                    >
                      {qItems.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => openAdd(q.id)}
                    className="rounded-lg border px-2 py-1.5 text-xs font-medium text-dashboard-text-muted hover:text-dashboard-text transition-colors"
                    style={{ borderColor: q.border }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <ul className="space-y-2 flex-1">
                {qItems.map((item) => (
                  <li
                    key={item.id}
                    className="group relative flex items-start gap-2.5 rounded-xl p-3 transition-all"
                    style={{
                      background: "hsl(var(--dashboard-card))",
                      border: `1px solid ${item.color}30`,
                      borderLeft: `3px solid ${item.color}`,
                      opacity: movingId === item.id ? 0.5 : 1,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-dashboard-text leading-snug">{item.title}</p>
                      {item.content && (
                        <p className="text-xs text-dashboard-text-muted mt-0.5 leading-relaxed">{item.content}</p>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {/* Move to another quadrant */}
                      <div className="relative group/move">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text transition-colors"
                          title="Move to…"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute right-0 top-7 z-20 hidden group-hover/move:flex flex-col gap-0.5 rounded-xl border border-dashboard-border bg-dashboard-card shadow-xl p-1.5 min-w-[160px]">
                          {QUADRANTS.filter((oq) => oq.id !== q.id).map((oq) => (
                            <button
                              key={oq.id}
                              type="button"
                              onClick={() => moveItem(item.id, oq.id)}
                              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-dashboard-text hover:bg-dashboard-card-hover transition-colors text-left"
                            >
                              <span style={{ color: oq.color }}>{oq.tag}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-lg p-1.5 text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="rounded-lg p-1.5 text-dashboard-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Empty state */}
              {qItems.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-6">
                  <button
                    type="button"
                    onClick={() => openAdd(q.id)}
                    className="flex flex-col items-center gap-2 text-center group/empty"
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover/empty:scale-110"
                      style={{ background: q.color + "15", border: `1px dashed ${q.color}40` }}
                    >
                      <Plus className="h-4 w-4" style={{ color: q.color }} />
                    </div>
                    <p className="text-xs text-dashboard-text-muted">Add first item</p>
                  </button>
                </div>
              )}

              {/* Quadrant number watermark */}
              <div
                className="absolute bottom-3 right-4 text-5xl font-black select-none pointer-events-none"
                style={{ color: q.color, opacity: 0.04 }}
              >
                {q.id}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      {totalItems > 0 && (
        <div
          className="rounded-2xl p-4 flex flex-wrap gap-4 dashboard-fade-in-delay-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {QUADRANTS.map((q) => {
            const count = items.filter((i) => i.quadrant === q.id).length;
            return (
              <div key={q.id} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: q.color }} />
                <span className="text-xs text-dashboard-text-muted">{q.title}:</span>
                <span className="text-xs font-bold" style={{ color: q.color }}>{count}</span>
              </div>
            );
          })}
          <div className="ml-auto text-xs text-dashboard-text-muted">{totalItems} total items</div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId
                ? <><Pencil className="h-4 w-4 text-violet-400" /> Edit Item</>
                : <><Sparkles className="h-4 w-4 text-violet-400" /> Add Priority Item</>
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {/* Quadrant picker */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-2 uppercase tracking-wider">Quadrant</label>
              <div className="grid grid-cols-2 gap-2">
                {QUADRANTS.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQuadrant(q.id)}
                    className="rounded-xl p-3 text-left transition-all"
                    style={quadrant === q.id ? {
                      background: q.bg,
                      border: `1.5px solid ${q.border}`,
                      color: q.color,
                    } : {
                      border: "1.5px solid hsl(var(--dashboard-border))",
                      color: "hsl(var(--dashboard-text-muted))",
                    }}
                  >
                    <div className="text-xs font-bold">{q.title}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{q.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="What needs to get done?"
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                autoFocus
              />
            </div>
            {/* Content */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Notes (optional)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Additional context or details…"
                rows={2}
                className="w-full rounded-xl border border-dashboard-border bg-dashboard-card px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
              />
            </div>
            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-dashboard-text-muted mb-1.5 uppercase tracking-wider">Label Color</label>
              <div className="flex gap-2 flex-wrap">
                {ITEM_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      background: c,
                      borderColor: color === c ? "white" : "transparent",
                      boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl border border-dashboard-border px-4 py-2.5 text-sm font-medium text-dashboard-text hover:bg-dashboard-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !title.trim()}
              className="rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-[.98]"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Item"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

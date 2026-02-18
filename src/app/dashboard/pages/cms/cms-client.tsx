"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Calendar,
  Star,
  Mic,
  BookOpen,
  Music,
  ExternalLink,
  ChevronRight,
  Video,
  Check,
  Loader2,
  Sparkles,
  Radio,
  PlayCircle,
  Clock,
  User,
  Link as LinkIcon,
  Image as ImageIcon,
  FileAudio,
  GripVertical,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { organizationId: string };

type EventItem = {
  id: string;
  name: string;
  description: string | null;
  start_at: string;
  image_url: string | null;
  venue_name: string | null;
  eventbrite_event_id: string | null;
  category: string | null;
};

type FeaturedSermon = {
  id?: string;
  title: string;
  tag: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  duration_minutes: number | null;
  speaker_name: string | null;
};

type PodcastEpisode = {
  id: string;
  episode_number: number;
  title: string;
  published_at: string | null;
  duration_minutes: number | null;
  audio_url: string | null;
};

type PodcastConfig = {
  title: string;
  description: string | null;
  spotify_url: string | null;
  apple_podcasts_url: string | null;
  youtube_url: string | null;
};

type WorshipRecording = {
  id: string;
  title: string;
  subtitle: string | null;
  duration_text: string | null;
  url: string | null;
};

type SermonArchiveItem = {
  id: string;
  title: string;
  tag: string | null;
  image_url: string | null;
  published_at: string | null;
  duration_minutes: number | null;
  speaker_name: string | null;
  video_url: string | null;
  audio_url: string | null;
};

const CATEGORIES = [
  { id: "events", label: "Events", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
  { id: "featured", label: "Featured Sermon", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
  { id: "podcast", label: "Podcast", icon: Mic, color: "text-purple-500", bg: "bg-purple-500/10", ring: "ring-purple-500/20" },
  { id: "archive", label: "Sermon Archive", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  { id: "worship", label: "Worship", icon: Music, color: "text-rose-500", bg: "bg-rose-500/10", ring: "ring-rose-500/20" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

/* ── Shared micro-components ── */

function SectionHeader({ title, description, icon: Icon, iconColor, iconBg, action }: {
  title: string; description: string; icon: React.ElementType;
  iconColor: string; iconBg: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-dashboard-text">{title}</h2>
          <p className="mt-0.5 text-sm text-dashboard-text-muted">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, description, action }: {
  icon: React.ElementType; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="cms-empty-state flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dashboard-border bg-dashboard/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-dashboard-card-hover">
        <Icon className="h-6 w-6 text-dashboard-text-muted" />
      </div>
      <p className="text-sm font-medium text-dashboard-text">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-dashboard-text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function SaveButton({ saving, savingKey, onClick, label }: {
  saving: string | null; savingKey: string; onClick: () => void; label: string;
}) {
  const isSaving = saving === savingKey;
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!isSaving && justSaved) {
      const t = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isSaving, justSaved]);

  return (
    <Button
      onClick={() => { onClick(); setJustSaved(true); }}
      disabled={!!saving}
      className={cn(
        "cms-save-btn relative overflow-hidden transition-all",
        justSaved && !isSaving
          ? "bg-emerald-500 text-white hover:bg-emerald-600"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      )}
    >
      {isSaving ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
      ) : justSaved ? (
        <><Check className="mr-2 h-4 w-4" />Saved</>
      ) : (
        label
      )}
    </Button>
  );
}

function FieldGroup({ label, hint, children, className }: {
  label: string; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-dashboard-text-muted">{label}</Label>
      {hint && <p className="mt-0.5 text-[11px] text-dashboard-text-muted/70">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ItemCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "cms-item-card group rounded-xl border border-dashboard-border bg-dashboard-card p-4 shadow-sm transition-all hover:shadow-md",
      className
    )}>
      {children}
    </div>
  );
}

function DeleteButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dashboard-text-muted opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 disabled:opacity-50 dark:hover:bg-rose-950"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-dashboard-card-hover px-1.5 text-[11px] font-medium tabular-nums text-dashboard-text-muted">
      {count}
    </span>
  );
}

/* ── Main CMS Client ── */

export function CmsClient({ organizationId }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("events");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [featuredSermon, setFeaturedSermon] = useState<FeaturedSermon | null>(null);
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [worshipRecordings, setWorshipRecordings] = useState<WorshipRecording[]>([]);
  const [sermonArchive, setSermonArchive] = useState<SermonArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/events?organizationId=${organizationId}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/website-cms/featured-sermon?organizationId=${organizationId}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/website-cms/podcast-config?organizationId=${organizationId}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/website-cms/podcast-episodes?organizationId=${organizationId}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/website-cms/worship-recordings?organizationId=${organizationId}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/website-cms/sermon-archive?organizationId=${organizationId}`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([evts, sermon, config, episodes, recordings, archive]) => {
        setEvents(Array.isArray(evts) ? evts : []);
        setFeaturedSermon(sermon?.id ? sermon : { title: "Featured Sermon", tag: null, description: null, image_url: null, video_url: null, audio_url: null, duration_minutes: null, speaker_name: null });
        setPodcastConfig(config?.organization_id ? config : { title: "Grace Daily Podcast", description: null, spotify_url: null, apple_podcasts_url: null, youtube_url: null });
        setPodcastEpisodes(Array.isArray(episodes) ? episodes : []);
        setWorshipRecordings(Array.isArray(recordings) ? recordings : []);
        setSermonArchive(Array.isArray(archive) ? archive : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId]);

  /* ── CRUD Helpers ── */

  const saveFeaturedSermon = useCallback(async () => {
    if (!featuredSermon) return;
    setSaving("sermon");
    try {
      const res = await fetch("/api/website-cms/featured-sermon", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, ...featuredSermon }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } finally {
      setSaving(null);
    }
  }, [featuredSermon, organizationId]);

  const savePodcastConfig = useCallback(async () => {
    if (!podcastConfig) return;
    setSaving("podcast-config");
    try {
      const res = await fetch("/api/website-cms/podcast-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, ...podcastConfig }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } finally {
      setSaving(null);
    }
  }, [podcastConfig, organizationId]);

  async function addPodcastEpisode() {
    const nextNum = podcastEpisodes.length ? Math.max(...podcastEpisodes.map((e) => e.episode_number)) + 1 : 1;
    setSaving("podcast");
    try {
      const res = await fetch("/api/website-cms/podcast-episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, episode_number: nextNum, title: "New Episode" }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPodcastEpisodes((prev) => [data, ...prev]);
    } finally {
      setSaving(null);
    }
  }

  async function deletePodcastEpisode(id: string) {
    setSaving("podcast");
    try {
      const res = await fetch(`/api/website-cms/podcast-episodes/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setPodcastEpisodes((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setSaving(null);
    }
  }

  async function patchPodcastEpisode(id: string, updates: Partial<PodcastEpisode>) {
    setPodcastEpisodes((prev) => prev.map((x) => (x.id === id ? { ...x, ...updates } : x)));
    const res = await fetch(`/api/website-cms/podcast-episodes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    });
    if (!res.ok) console.error("Update failed");
  }

  async function addWorshipRecording() {
    setSaving("worship");
    try {
      const res = await fetch("/api/website-cms/worship-recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, title: "New Recording" }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWorshipRecordings((prev) => [...prev, data]);
    } finally {
      setSaving(null);
    }
  }

  async function deleteWorshipRecording(id: string) {
    setSaving("worship");
    try {
      const res = await fetch(`/api/website-cms/worship-recordings/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setWorshipRecordings((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setSaving(null);
    }
  }

  async function patchWorshipRecording(id: string, updates: Partial<WorshipRecording>) {
    setWorshipRecordings((prev) => prev.map((x) => (x.id === id ? { ...x, ...updates } : x)));
    const res = await fetch(`/api/website-cms/worship-recordings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    });
    if (!res.ok) console.error("Update failed");
  }

  async function addSermonArchive() {
    setSaving("sermon-archive");
    try {
      const res = await fetch("/api/website-cms/sermon-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, title: "New Sermon" }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSermonArchive((prev) => [...prev, data]);
    } finally {
      setSaving(null);
    }
  }

  async function deleteSermonArchive(id: string) {
    setSaving("sermon-archive");
    try {
      const res = await fetch(`/api/website-cms/sermon-archive/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setSermonArchive((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setSaving(null);
    }
  }

  async function patchSermonArchive(id: string, updates: Partial<SermonArchiveItem>) {
    setSermonArchive((prev) => prev.map((x) => (x.id === id ? { ...x, ...updates } : x)));
    const res = await fetch(`/api/website-cms/sermon-archive/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    });
    if (!res.ok) console.error("Update failed");
  }

  /* ── Content counts for sidebar badges ── */
  const counts: Record<CategoryId, number> = {
    events: events.length,
    featured: featuredSermon?.id ? 1 : 0,
    podcast: podcastEpisodes.length,
    archive: sermonArchive.length,
    worship: worshipRecordings.length,
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="cms-loading flex flex-col gap-6 md:flex-row md:gap-8">
        <div className="hidden w-56 shrink-0 flex-col gap-2 md:flex">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-dashboard-card-hover" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-dashboard-card-hover" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-dashboard-card-hover" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-layout flex flex-col gap-6 md:flex-row md:gap-8">
      {/* ── Sidebar Navigation (Desktop) ── */}
      <aside className="hidden w-56 shrink-0 flex-col gap-1 md:flex">
        <div className="sticky top-24 space-y-1">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-dashboard-text-muted/60">
            Content Types
          </p>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "cms-nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                  isActive
                    ? "bg-dashboard-card text-dashboard-text shadow-sm ring-1 ring-dashboard-border"
                    : "text-dashboard-text-muted hover:bg-dashboard-card-hover hover:text-dashboard-text"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isActive ? cat.bg : "bg-transparent group-hover:bg-dashboard-card-hover"
                )}>
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? cat.color : "text-dashboard-text-muted")} />
                </div>
                <span className="flex-1 truncate">{cat.label}</span>
                <CountBadge count={counts[cat.id]} />
              </button>
            );
          })}

          {/* Quick stats */}
          <div className="mt-6 rounded-xl border border-dashboard-border bg-dashboard-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-dashboard-text-muted/60">Overview</p>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dashboard-text-muted">Total items</span>
                <span className="text-sm font-semibold tabular-nums text-dashboard-text">
                  {Object.values(counts).reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dashboard-text-muted">Content types</span>
                <span className="text-sm font-semibold tabular-nums text-dashboard-text">
                  {Object.values(counts).filter((c) => c > 0).length}/{CATEGORIES.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Category Tabs ── */}
      <div className="flex shrink-0 gap-2 overflow-x-auto pb-2 md:hidden">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "border-dashboard-border bg-dashboard-card text-dashboard-text-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
              {counts[cat.id] > 0 && (
                <span className="ml-0.5 text-[11px] opacity-60">({counts[cat.id]})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content Area ── */}
      <div className="min-w-0 flex-1">
        <div className="cms-content space-y-6 pb-8">
          {/* ═══════════════ Events ═══════════════ */}
          {activeCategory === "events" && (
            <section className="cms-section space-y-5">
              <SectionHeader
                title="Events"
                description="Upcoming events synced from your Events dashboard. Manage or create events there."
                icon={Calendar}
                iconColor="text-blue-500"
                iconBg="bg-blue-500/10"
                action={
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="rounded-lg border-dashboard-border">
                      <Link href="/dashboard/events">Manage Events</Link>
                    </Button>
                    <Button size="sm" asChild className="rounded-lg bg-emerald-600 hover:bg-emerald-700">
                      <Link href="/dashboard/events/new">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Create Event
                      </Link>
                    </Button>
                  </div>
                }
              />

              {events.length === 0 ? (
                <EmptyBlock
                  icon={Calendar}
                  title="No upcoming events"
                  description="Create events in the Events dashboard. They'll automatically appear on your website."
                  action={
                    <Button variant="outline" size="sm" className="rounded-lg" asChild>
                      <Link href="/dashboard/events/new">Create your first event</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((e, idx) => {
                    const d = new Date(e.start_at);
                    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                    const day = d.getDate();
                    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                    const img = e.image_url || "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=700";
                    return (
                      <div
                        key={e.id}
                        className="cms-event-card group overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm transition-all hover:shadow-md"
                        style={{ animationDelay: `${idx * 80}ms` }}
                      >
                        <div className="relative h-36 overflow-hidden">
                          <img src={img} alt={e.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-end gap-2">
                            <div className="flex flex-col items-center rounded-lg bg-white/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm dark:bg-slate-900/95">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{month}</span>
                              <span className="text-lg font-bold leading-tight text-dashboard-text">{day}</span>
                            </div>
                          </div>
                          {e.category && (
                            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-300">
                              {e.category}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-dashboard-text line-clamp-2 leading-snug">{e.name}</h3>
                          <div className="mt-2 flex items-center gap-3 text-xs text-dashboard-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {time}
                            </span>
                            {e.venue_name && (
                              <span className="truncate">{e.venue_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ═══════════════ Featured Sermon ═══════════════ */}
          {activeCategory === "featured" && (
            <section className="cms-section space-y-5">
              <SectionHeader
                title="Featured Sermon"
                description="The hero sermon displayed prominently on your Media page."
                icon={Star}
                iconColor="text-amber-500"
                iconBg="bg-amber-500/10"
              />

              <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row">
                  {/* Preview */}
                  <div className="shrink-0">
                    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-dashboard-border bg-dashboard lg:w-72">
                      {featuredSermon?.image_url ? (
                        <img src={featuredSermon.image_url} alt="" className="h-full w-full object-cover" />
                      ) : featuredSermon?.video_url ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-dashboard-text-muted">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                            <PlayCircle className="h-6 w-6 text-emerald-500" />
                          </div>
                          <span className="text-xs font-medium">Video linked</span>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-dashboard-text-muted">
                          <ImageIcon className="h-8 w-8 opacity-40" />
                          <span className="text-xs">Add an image or video URL</span>
                        </div>
                      )}
                      {featuredSermon?.tag && (
                        <span className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                          {featuredSermon.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Form */}
                  <div className="min-w-0 flex-1 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldGroup label="Title">
                        <Input
                          value={featuredSermon?.title ?? ""}
                          onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, title: e.target.value } : null))}
                          placeholder="When God Feels Distant"
                          className="rounded-lg border-dashboard-input-border bg-dashboard-input"
                        />
                      </FieldGroup>
                      <FieldGroup label="Series / Tag">
                        <Input
                          value={featuredSermon?.tag ?? ""}
                          onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, tag: e.target.value || null } : null))}
                          placeholder="Current Series · Week 4"
                          className="rounded-lg border-dashboard-input-border bg-dashboard-input"
                        />
                      </FieldGroup>
                    </div>

                    <FieldGroup label="Description">
                      <textarea
                        className="w-full rounded-lg border border-dashboard-input-border bg-dashboard-input px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                        rows={3}
                        value={featuredSermon?.description ?? ""}
                        onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, description: e.target.value || null } : null))}
                        placeholder="Pastor David walks us through..."
                      />
                    </FieldGroup>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldGroup label="Image URL" hint="Thumbnail for the sermon card">
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted/40" />
                          <Input
                            value={featuredSermon?.image_url ?? ""}
                            onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, image_url: e.target.value || null } : null))}
                            placeholder="https://..."
                            className="rounded-lg border-dashboard-input-border bg-dashboard-input pl-9"
                          />
                        </div>
                      </FieldGroup>
                      <FieldGroup label="Video URL" hint="YouTube or direct MP4 link">
                        <div className="relative">
                          <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted/40" />
                          <Input
                            value={featuredSermon?.video_url ?? ""}
                            onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, video_url: e.target.value || null } : null))}
                            placeholder="https://..."
                            className="rounded-lg border-dashboard-input-border bg-dashboard-input pl-9"
                          />
                        </div>
                      </FieldGroup>
                      <FieldGroup label="Audio URL">
                        <div className="relative">
                          <FileAudio className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted/40" />
                          <Input
                            value={featuredSermon?.audio_url ?? ""}
                            onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, audio_url: e.target.value || null } : null))}
                            placeholder="https://..."
                            className="rounded-lg border-dashboard-input-border bg-dashboard-input pl-9"
                          />
                        </div>
                      </FieldGroup>
                      <FieldGroup label="Speaker">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted/40" />
                          <Input
                            value={featuredSermon?.speaker_name ?? ""}
                            onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, speaker_name: e.target.value || null } : null))}
                            placeholder="Pastor David Mercer"
                            className="rounded-lg border-dashboard-input-border bg-dashboard-input pl-9"
                          />
                        </div>
                      </FieldGroup>
                      <FieldGroup label="Duration (minutes)">
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted/40" />
                          <Input
                            type="number"
                            value={featuredSermon?.duration_minutes ?? ""}
                            onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null } : null))}
                            placeholder="47"
                            className="rounded-lg border-dashboard-input-border bg-dashboard-input pl-9"
                          />
                        </div>
                      </FieldGroup>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-dashboard-border pt-4">
                  <p className="text-xs text-dashboard-text-muted">Changes auto-save to your website when you click Save.</p>
                  <SaveButton saving={saving} savingKey="sermon" onClick={saveFeaturedSermon} label="Save Sermon" />
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════ Podcast ═══════════════ */}
          {activeCategory === "podcast" && (
            <section className="cms-section space-y-6">
              <SectionHeader
                title="Podcast"
                description="Manage your podcast settings and episode listings."
                icon={Mic}
                iconColor="text-purple-500"
                iconBg="bg-purple-500/10"
              />

              {/* Podcast config card */}
              <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-dashboard-text">Podcast Settings</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup label="Podcast Title">
                    <Input
                      value={podcastConfig?.title ?? ""}
                      onChange={(e) => setPodcastConfig((p) => (p ? { ...p, title: e.target.value } : null))}
                      placeholder="Grace Daily Podcast"
                      className="rounded-lg border-dashboard-input-border bg-dashboard-input"
                    />
                  </FieldGroup>
                  <div />
                  <FieldGroup label="Description" className="sm:col-span-2">
                    <textarea
                      className="w-full rounded-lg border border-dashboard-input-border bg-dashboard-input px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                      rows={2}
                      value={podcastConfig?.description ?? ""}
                      onChange={(e) => setPodcastConfig((p) => (p ? { ...p, description: e.target.value || null } : null))}
                      placeholder="Short daily devotionals..."
                    />
                  </FieldGroup>
                </div>

                <div className="mt-4 rounded-xl border border-dashboard-border bg-dashboard p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dashboard-text-muted/60">Platform Links</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FieldGroup label="Spotify">
                      <Input
                        value={podcastConfig?.spotify_url ?? ""}
                        onChange={(e) => setPodcastConfig((p) => (p ? { ...p, spotify_url: e.target.value || null } : null))}
                        placeholder="https://open.spotify.com/..."
                        className="rounded-lg border-dashboard-input-border bg-dashboard-card text-sm"
                      />
                    </FieldGroup>
                    <FieldGroup label="Apple Podcasts">
                      <Input
                        value={podcastConfig?.apple_podcasts_url ?? ""}
                        onChange={(e) => setPodcastConfig((p) => (p ? { ...p, apple_podcasts_url: e.target.value || null } : null))}
                        placeholder="https://podcasts.apple.com/..."
                        className="rounded-lg border-dashboard-input-border bg-dashboard-card text-sm"
                      />
                    </FieldGroup>
                    <FieldGroup label="YouTube">
                      <Input
                        value={podcastConfig?.youtube_url ?? ""}
                        onChange={(e) => setPodcastConfig((p) => (p ? { ...p, youtube_url: e.target.value || null } : null))}
                        placeholder="https://youtube.com/..."
                        className="rounded-lg border-dashboard-input-border bg-dashboard-card text-sm"
                      />
                    </FieldGroup>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <SaveButton saving={saving} savingKey="podcast-config" onClick={savePodcastConfig} label="Save Settings" />
                </div>
              </div>

              {/* Episodes list */}
              <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-dashboard-text">Episodes</h3>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                      {podcastEpisodes.length}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={addPodcastEpisode} disabled={!!saving} className="rounded-lg border-dashboard-border">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Episode
                  </Button>
                </div>

                {podcastEpisodes.length === 0 ? (
                  <EmptyBlock
                    icon={Mic}
                    title="No episodes yet"
                    description="Add your first podcast episode to display on your website."
                  />
                ) : (
                  <div className="space-y-3">
                    {podcastEpisodes.map((ep, idx) => (
                      <ItemCard key={ep.id}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                            <span className="text-sm font-bold text-purple-500">#{ep.episode_number}</span>
                          </div>
                          <div className="min-w-0 flex-1 space-y-3">
                            <Input
                              value={ep.title}
                              onChange={(e) => patchPodcastEpisode(ep.id, { title: e.target.value })}
                              placeholder="Episode title"
                              className="border-0 bg-transparent px-0 text-sm font-medium text-dashboard-text shadow-none focus-visible:ring-0"
                            />
                            <div className="grid gap-3 sm:grid-cols-3">
                              <FieldGroup label="Date">
                                <Input
                                  type="date"
                                  value={ep.published_at ? ep.published_at.slice(0, 10) : ""}
                                  onChange={(e) => patchPodcastEpisode(ep.id, { published_at: e.target.value || null })}
                                  className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                                />
                              </FieldGroup>
                              <FieldGroup label="Duration (min)">
                                <Input
                                  type="number"
                                  value={ep.duration_minutes ?? ""}
                                  onChange={(e) => patchPodcastEpisode(ep.id, { duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null })}
                                  className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                                />
                              </FieldGroup>
                              <FieldGroup label="Audio URL">
                                <Input
                                  value={ep.audio_url ?? ""}
                                  onChange={(e) => patchPodcastEpisode(ep.id, { audio_url: e.target.value || null })}
                                  placeholder="https://..."
                                  className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                                />
                              </FieldGroup>
                            </div>
                          </div>
                          <DeleteButton onClick={() => deletePodcastEpisode(ep.id)} disabled={!!saving} />
                        </div>
                      </ItemCard>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═══════════════ Sermon Archive ═══════════════ */}
          {activeCategory === "archive" && (
            <section className="cms-section space-y-5">
              <SectionHeader
                title="Sermon Archive"
                description="Past sermons shown in the sermon grid on your Media page."
                icon={BookOpen}
                iconColor="text-emerald-500"
                iconBg="bg-emerald-500/10"
                action={
                  <Button variant="outline" size="sm" onClick={addSermonArchive} disabled={!!saving} className="rounded-lg border-dashboard-border">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Sermon
                  </Button>
                }
              />

              {sermonArchive.length === 0 ? (
                <EmptyBlock
                  icon={BookOpen}
                  title="No sermons yet"
                  description="Add past sermons with video or audio links to build your sermon archive."
                  action={
                    <Button variant="outline" size="sm" onClick={addSermonArchive} disabled={!!saving} className="rounded-lg">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add your first sermon
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {sermonArchive.map((s, idx) => (
                    <ItemCard key={s.id}>
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-dashboard-border bg-dashboard">
                          {s.image_url ? (
                            <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                          ) : s.video_url ? (
                            <div className="flex h-full flex-col items-center justify-center gap-1 text-dashboard-text-muted">
                              <PlayCircle className="h-6 w-6 text-emerald-500/60" />
                              <span className="text-[10px]">Video linked</span>
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-dashboard-text-muted/30" />
                            </div>
                          )}
                          {s.tag && (
                            <span className="absolute left-1.5 top-1.5 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                              {s.tag}
                            </span>
                          )}
                        </div>

                        {/* Fields */}
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex gap-3">
                            <Input
                              className="flex-1 border-0 bg-transparent px-0 text-sm font-semibold text-dashboard-text shadow-none focus-visible:ring-0"
                              value={s.title}
                              onChange={(e) => patchSermonArchive(s.id, { title: e.target.value })}
                              placeholder="Sermon title"
                            />
                            <Input
                              className="w-36 rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                              value={s.tag ?? ""}
                              onChange={(e) => patchSermonArchive(s.id, { tag: e.target.value || null })}
                              placeholder="Series tag"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <FieldGroup label="Image URL">
                              <Input
                                value={s.image_url ?? ""}
                                onChange={(e) => patchSermonArchive(s.id, { image_url: e.target.value || null })}
                                placeholder="https://..."
                                className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                              />
                            </FieldGroup>
                            <FieldGroup label="Date">
                              <Input
                                type="date"
                                value={s.published_at ? s.published_at.slice(0, 10) : ""}
                                onChange={(e) => patchSermonArchive(s.id, { published_at: e.target.value || null })}
                                className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                              />
                            </FieldGroup>
                            <FieldGroup label="Duration">
                              <Input
                                type="number"
                                value={s.duration_minutes ?? ""}
                                onChange={(e) => patchSermonArchive(s.id, { duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null })}
                                placeholder="mins"
                                className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                              />
                            </FieldGroup>
                            <FieldGroup label="Speaker">
                              <Input
                                value={s.speaker_name ?? ""}
                                onChange={(e) => patchSermonArchive(s.id, { speaker_name: e.target.value || null })}
                                placeholder="Speaker"
                                className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                              />
                            </FieldGroup>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <FieldGroup label="Video URL">
                              <Input
                                value={s.video_url ?? ""}
                                onChange={(e) => patchSermonArchive(s.id, { video_url: e.target.value || null })}
                                placeholder="https://..."
                                className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                              />
                            </FieldGroup>
                            <FieldGroup label="Audio URL">
                              <Input
                                value={s.audio_url ?? ""}
                                onChange={(e) => patchSermonArchive(s.id, { audio_url: e.target.value || null })}
                                placeholder="https://..."
                                className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                              />
                            </FieldGroup>
                          </div>
                        </div>

                        <DeleteButton onClick={() => deleteSermonArchive(s.id)} disabled={!!saving} />
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ═══════════════ Worship Recordings ═══════════════ */}
          {activeCategory === "worship" && (
            <section className="cms-section space-y-5">
              <SectionHeader
                title="Worship Recordings"
                description="Live worship songs and recordings for your Media page."
                icon={Music}
                iconColor="text-rose-500"
                iconBg="bg-rose-500/10"
                action={
                  <Button variant="outline" size="sm" onClick={addWorshipRecording} disabled={!!saving} className="rounded-lg border-dashboard-border">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Recording
                  </Button>
                }
              />

              {worshipRecordings.length === 0 ? (
                <EmptyBlock
                  icon={Music}
                  title="No recordings yet"
                  description="Add worship recordings with audio or video links to display on your Media page."
                  action={
                    <Button variant="outline" size="sm" onClick={addWorshipRecording} disabled={!!saving} className="rounded-lg">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add your first recording
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {worshipRecordings.map((rec, idx) => (
                    <ItemCard key={rec.id}>
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                          <Music className="h-5 w-5 text-rose-500" />
                        </div>
                        <div className="min-w-0 flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <Input
                            value={rec.title}
                            onChange={(e) => patchWorshipRecording(rec.id, { title: e.target.value })}
                            placeholder="Song title"
                            className="border-0 bg-transparent px-0 font-medium text-dashboard-text shadow-none focus-visible:ring-0"
                          />
                          <Input
                            value={rec.subtitle ?? ""}
                            onChange={(e) => patchWorshipRecording(rec.id, { subtitle: e.target.value || null })}
                            placeholder="Subtitle (e.g. Feb 9 · Live)"
                            className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                          />
                          <Input
                            value={rec.duration_text ?? ""}
                            onChange={(e) => patchWorshipRecording(rec.id, { duration_text: e.target.value || null })}
                            placeholder="Duration (e.g. 6:14)"
                            className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                          />
                          <Input
                            value={rec.url ?? ""}
                            onChange={(e) => patchWorshipRecording(rec.id, { url: e.target.value || null })}
                            placeholder="Audio/Video URL"
                            className="rounded-lg border-dashboard-input-border bg-dashboard-input text-sm"
                          />
                        </div>
                        <DeleteButton onClick={() => deleteWorshipRecording(rec.id)} disabled={!!saving} />
                      </div>
                    </ItemCard>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

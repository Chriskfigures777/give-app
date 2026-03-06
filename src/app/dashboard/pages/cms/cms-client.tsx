"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Calendar,
  Star,
  Mic,
  BookOpen,
  Music,
  ExternalLink,
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
  {
    id: "events",
    label: "Events",
    icon: Calendar,
    color: "text-blue-400",
    activeColor: "text-blue-300",
    bg: "bg-blue-500/15",
    pill: "bg-blue-500/15 text-blue-300",
    accent: "border-blue-500",
  },
  {
    id: "featured",
    label: "Featured Sermon",
    icon: Star,
    color: "text-amber-400",
    activeColor: "text-amber-300",
    bg: "bg-amber-500/15",
    pill: "bg-amber-500/15 text-amber-300",
    accent: "border-amber-500",
  },
  {
    id: "podcast",
    label: "Podcast",
    icon: Mic,
    color: "text-purple-400",
    activeColor: "text-purple-300",
    bg: "bg-purple-500/15",
    pill: "bg-purple-500/15 text-purple-300",
    accent: "border-purple-500",
  },
  {
    id: "archive",
    label: "Sermon Archive",
    icon: BookOpen,
    color: "text-emerald-400",
    activeColor: "text-emerald-300",
    bg: "bg-emerald-500/15",
    pill: "bg-emerald-500/15 text-emerald-300",
    accent: "border-emerald-500",
  },
  {
    id: "worship",
    label: "Worship",
    icon: Music,
    color: "text-rose-400",
    activeColor: "text-rose-300",
    bg: "bg-rose-500/15",
    pill: "bg-rose-500/15 text-rose-300",
    accent: "border-rose-500",
  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

/* ────────────────────────────────────────────────
   SHARED UI PRIMITIVES
   ──────────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-dashboard-text">
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs text-dashboard-text-muted">{children}</p>;
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel>{label}</FieldLabel>
      {hint && <FieldHint>{hint}</FieldHint>}
      {children}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-dashboard-border bg-[hsl(var(--dashboard-card-hover))] px-4 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40";

function CmsInput({
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ElementType;
}) {
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted/50" />
        <input {...props} className={cn(inputBase, "pl-10", className)} />
      </div>
    );
  }
  return <input {...props} className={cn(inputBase, className)} />;
}

function CmsTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        inputBase,
        "resize-none leading-relaxed",
        className
      )}
    />
  );
}

function SaveButton({
  saving,
  savingKey,
  onClick,
  label,
}: {
  saving: string | null;
  savingKey: string;
  onClick: () => void;
  label: string;
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
    <button
      type="button"
      onClick={() => { onClick(); setJustSaved(true); }}
      disabled={!!saving}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60",
        justSaved && !isSaving
          ? "bg-emerald-500 text-white"
          : "bg-emerald-600 text-white hover:bg-emerald-500"
      )}
    >
      {isSaving ? (
        <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
      ) : justSaved ? (
        <><Check className="h-4 w-4" />Saved!</>
      ) : label}
    </button>
  );
}

function DeleteBtn({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-dashboard-text-muted/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-xl bg-dashboard-card-hover" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 rounded-2xl bg-dashboard-card-hover" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  color,
  bg,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dashboard-border py-20 text-center">
      <div className={cn("mb-5 flex h-16 w-16 items-center justify-center rounded-2xl", bg)}>
        <Icon className={cn("h-8 w-8", color)} />
      </div>
      <p className="text-base font-bold text-dashboard-text">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-dashboard-text-muted leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashboard-border bg-dashboard-card-hover/30 p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-dashboard-text-muted/60">{title}</p>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────── */

export function CmsClient({ organizationId }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("events");
  const [saving, setSaving] = useState<string | null>(null);

  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [featuredSermon, setFeaturedSermon] = useState<FeaturedSermon | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [podcastConfig, setPodcastConfig] = useState<PodcastConfig | null>(null);
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[] | null>(null);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [worshipRecordings, setWorshipRecordings] = useState<WorshipRecording[] | null>(null);
  const [worshipLoading, setWorshipLoading] = useState(false);
  const [sermonArchive, setSermonArchive] = useState<SermonArchiveItem[] | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const fetchedRef = useRef<Set<CategoryId>>(new Set());

  useEffect(() => {
    const base = { credentials: "include" as RequestCredentials };
    const org = `organizationId=${organizationId}`;

    setEventsLoading(true);
    fetch(`/api/events?${org}`, base)
      .then((r) => r.json()).then((d) => setEvents(Array.isArray(d) ? d : [])).catch(() => setEvents([])).finally(() => setEventsLoading(false));

    setFeaturedLoading(true);
    fetch(`/api/website-cms/featured-sermon?${org}`, base)
      .then((r) => r.json())
      .then((d) => setFeaturedSermon(d?.id ? d : { title: "Featured Sermon", tag: null, description: null, image_url: null, video_url: null, audio_url: null, duration_minutes: null, speaker_name: null }))
      .catch(() => setFeaturedSermon({ title: "Featured Sermon", tag: null, description: null, image_url: null, video_url: null, audio_url: null, duration_minutes: null, speaker_name: null }))
      .finally(() => setFeaturedLoading(false));

    setPodcastLoading(true);
    Promise.all([
      fetch(`/api/website-cms/podcast-config?${org}`, base).then((r) => r.json()),
      fetch(`/api/website-cms/podcast-episodes?${org}`, base).then((r) => r.json()),
    ]).then(([cfg, eps]) => {
      setPodcastConfig(cfg?.organization_id ? cfg : { title: "Grace Daily Podcast", description: null, spotify_url: null, apple_podcasts_url: null, youtube_url: null });
      setPodcastEpisodes(Array.isArray(eps) ? eps : []);
    }).catch(() => {
      setPodcastConfig({ title: "Grace Daily Podcast", description: null, spotify_url: null, apple_podcasts_url: null, youtube_url: null });
      setPodcastEpisodes([]);
    }).finally(() => setPodcastLoading(false));

    setArchiveLoading(true);
    fetch(`/api/website-cms/sermon-archive?${org}`, base)
      .then((r) => r.json()).then((d) => setSermonArchive(Array.isArray(d) ? d : [])).catch(() => setSermonArchive([])).finally(() => setArchiveLoading(false));

    setWorshipLoading(true);
    fetch(`/api/website-cms/worship-recordings?${org}`, base)
      .then((r) => r.json()).then((d) => setWorshipRecordings(Array.isArray(d) ? d : [])).catch(() => setWorshipRecordings([])).finally(() => setWorshipLoading(false));

    fetchedRef.current = new Set(["events", "featured", "podcast", "archive", "worship"]);
  }, [organizationId]);

  /* CRUD */
  const saveFeaturedSermon = useCallback(async () => {
    if (!featuredSermon) return;
    setSaving("sermon");
    try {
      await fetch("/api/website-cms/featured-sermon", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, ...featuredSermon }), credentials: "include" });
    } finally { setSaving(null); }
  }, [featuredSermon, organizationId]);

  const savePodcastConfig = useCallback(async () => {
    if (!podcastConfig) return;
    setSaving("podcast-config");
    try {
      await fetch("/api/website-cms/podcast-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, ...podcastConfig }), credentials: "include" });
    } finally { setSaving(null); }
  }, [podcastConfig, organizationId]);

  async function addPodcastEpisode() {
    const eps = podcastEpisodes ?? [];
    const nextNum = eps.length ? Math.max(...eps.map((e) => e.episode_number)) + 1 : 1;
    setSaving("podcast");
    try {
      const res = await fetch("/api/website-cms/podcast-episodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, episode_number: nextNum, title: "New Episode" }), credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPodcastEpisodes((prev) => [data, ...(prev ?? [])]);
    } finally { setSaving(null); }
  }

  async function deletePodcastEpisode(id: string) {
    setSaving("podcast");
    try {
      const res = await fetch(`/api/website-cms/podcast-episodes/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setPodcastEpisodes((prev) => (prev ?? []).filter((e) => e.id !== id));
    } finally { setSaving(null); }
  }

  async function patchPodcastEpisode(id: string, updates: Partial<PodcastEpisode>) {
    setPodcastEpisodes((prev) => (prev ?? []).map((x) => (x.id === id ? { ...x, ...updates } : x)));
    await fetch(`/api/website-cms/podcast-episodes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates), credentials: "include" });
  }

  async function addWorshipRecording() {
    setSaving("worship");
    try {
      const res = await fetch("/api/website-cms/worship-recordings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, title: "New Recording" }), credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWorshipRecordings((prev) => [...(prev ?? []), data]);
    } finally { setSaving(null); }
  }

  async function deleteWorshipRecording(id: string) {
    setSaving("worship");
    try {
      const res = await fetch(`/api/website-cms/worship-recordings/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setWorshipRecordings((prev) => (prev ?? []).filter((e) => e.id !== id));
    } finally { setSaving(null); }
  }

  async function patchWorshipRecording(id: string, updates: Partial<WorshipRecording>) {
    setWorshipRecordings((prev) => (prev ?? []).map((x) => (x.id === id ? { ...x, ...updates } : x)));
    await fetch(`/api/website-cms/worship-recordings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates), credentials: "include" });
  }

  async function addSermonArchive() {
    setSaving("sermon-archive");
    try {
      const res = await fetch("/api/website-cms/sermon-archive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, title: "New Sermon" }), credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSermonArchive((prev) => [...(prev ?? []), data]);
    } finally { setSaving(null); }
  }

  async function deleteSermonArchive(id: string) {
    setSaving("sermon-archive");
    try {
      const res = await fetch(`/api/website-cms/sermon-archive/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setSermonArchive((prev) => (prev ?? []).filter((e) => e.id !== id));
    } finally { setSaving(null); }
  }

  async function patchSermonArchive(id: string, updates: Partial<SermonArchiveItem>) {
    setSermonArchive((prev) => (prev ?? []).map((x) => (x.id === id ? { ...x, ...updates } : x)));
    await fetch(`/api/website-cms/sermon-archive/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates), credentials: "include" });
  }

  const counts: Record<CategoryId, number> = {
    events: events?.length ?? 0,
    featured: featuredSermon?.id ? 1 : 0,
    podcast: podcastEpisodes?.length ?? 0,
    archive: sermonArchive?.length ?? 0,
    worship: worshipRecordings?.length ?? 0,
  };
  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);
  const filledTypes = Object.values(counts).filter((c) => c > 0).length;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

      {/* ── SIDEBAR ── */}
      <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
        <div className="sticky top-24">

          {/* Stats overview card */}
          <div className="mb-6 rounded-2xl border border-dashboard-border bg-dashboard-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-dashboard-text-muted/60 mb-4">Content Overview</p>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-3xl font-black text-dashboard-text tabular-nums">{totalItems}</p>
                <p className="text-sm text-dashboard-text-muted mt-0.5">total items</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-dashboard-text tabular-nums">{filledTypes}<span className="text-dashboard-text-muted font-normal text-base">/{CATEGORIES.length}</span></p>
                <p className="text-sm text-dashboard-text-muted mt-0.5">types active</p>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-dashboard-card-hover">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                style={{ width: `${(filledTypes / CATEGORIES.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Nav */}
          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = counts[cat.id];
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "group flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all",
                    isActive
                      ? cn("bg-dashboard-card shadow-sm border border-dashboard-border", cat.color)
                      : "text-dashboard-text-muted hover:bg-dashboard-card/70 hover:text-dashboard-text"
                  )}
                >
                  {/* Colored icon container */}
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isActive ? cat.bg : "bg-dashboard-card-hover group-hover:bg-dashboard-card"
                  )}>
                    <Icon className={cn("h-4.5 h-[18px] w-[18px] transition-colors", isActive ? cat.color : "text-dashboard-text-muted group-hover:text-dashboard-text")} />
                  </div>

                  <span className={cn(
                    "flex-1 text-sm font-semibold transition-colors",
                    isActive ? "text-dashboard-text" : "text-dashboard-text-muted group-hover:text-dashboard-text"
                  )}>
                    {cat.label}
                  </span>

                  {/* Count */}
                  <span className={cn(
                    "flex h-6 min-w-[24px] items-center justify-center rounded-lg px-1.5 text-xs font-bold tabular-nums transition-colors",
                    isActive ? cat.pill : "bg-dashboard-card-hover text-dashboard-text-muted",
                    count === 0 && "opacity-40"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <div className="min-w-0 flex-1">

        {/* Mobile tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all",
                  isActive
                    ? cn("border-transparent text-white", cat.bg, cat.color)
                    : "border-dashboard-border bg-dashboard-card text-dashboard-text-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
                {counts[cat.id] > 0 && <span className="opacity-60">·{counts[cat.id]}</span>}
              </button>
            );
          })}
        </div>

        {/* ═══ EVENTS ═══ */}
        {activeCategory === "events" && (
          eventsLoading ? <SectionSkeleton /> : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-dashboard-text">Events</h2>
                  <p className="mt-1.5 text-sm text-dashboard-text-muted">
                    Upcoming events synced from your Events dashboard. Create and manage events there.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/dashboard/events"
                    className="inline-flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-sm font-semibold text-dashboard-text-muted transition-all hover:border-dashboard-border-light hover:text-dashboard-text"
                  >
                    Manage Events
                  </Link>
                  <Link
                    href="/dashboard/events/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500"
                  >
                    <Plus className="h-4 w-4" />
                    Create Event
                  </Link>
                </div>
              </div>

              {!events || events.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  color="text-blue-400"
                  bg="bg-blue-500/15"
                  title="No upcoming events"
                  description="Create events in the Events dashboard — they'll automatically appear on your website."
                  action={
                    <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-5 py-2.5 text-sm font-semibold text-dashboard-text transition-all hover:border-dashboard-border-light">
                      <Plus className="h-4 w-4" />
                      Create your first event
                    </Link>
                  }
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((e) => {
                    const d = new Date(e.start_at);
                    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                    const day = d.getDate();
                    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                    const img = e.image_url || "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=700";
                    return (
                      <div
                        key={e.id}
                        className="group overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-card transition-all hover:border-dashboard-border-light hover:shadow-lg"
                      >
                        <div className="relative h-40 overflow-hidden">
                          <img src={img} alt={e.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <div className="absolute bottom-3 left-3">
                            <div className="flex flex-col items-center rounded-xl bg-white/95 px-3 py-1.5 shadow-lg dark:bg-[#181c26]/95 backdrop-blur-sm min-w-[44px]">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">{month}</span>
                              <span className="text-xl font-black leading-tight text-dashboard-text">{day}</span>
                            </div>
                          </div>
                          {e.category && (
                            <span className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                              {e.category}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-base font-bold text-dashboard-text leading-snug">{e.name}</h3>
                          {e.description && (
                            <p className="mt-1.5 line-clamp-2 text-sm text-dashboard-text-muted leading-relaxed">{e.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-dashboard-text-muted">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              {time}
                            </span>
                            {e.venue_name && <span className="truncate">{e.venue_name}</span>}
                          </div>
                          <div className="mt-4 pt-3 border-t border-dashboard-border">
                            <Link
                              href={`/dashboard/events/${e.id}/edit`}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Edit event details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}

        {/* ═══ FEATURED SERMON ═══ */}
        {activeCategory === "featured" && (
          featuredLoading ? <SectionSkeleton /> : (
            <div className="space-y-7">
              <div>
                <h2 className="text-2xl font-bold text-dashboard-text">Featured Sermon</h2>
                <p className="mt-1.5 text-sm text-dashboard-text-muted">
                  The hero sermon displayed prominently on your Media page.
                </p>
              </div>

              <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 space-y-7">
                {/* Preview + primary fields */}
                <div className="flex flex-col gap-6 lg:flex-row">
                  {/* Thumbnail */}
                  <div className="lg:w-72 shrink-0">
                    <p className="mb-2 text-sm font-semibold text-dashboard-text">Thumbnail Preview</p>
                    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-card-hover/50">
                      {featuredSermon?.image_url ? (
                        <img src={featuredSermon.image_url} alt="" className="h-full w-full object-cover" />
                      ) : featuredSermon?.video_url ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                            <PlayCircle className="h-7 w-7 text-emerald-500" />
                          </div>
                          <span className="text-sm font-medium text-dashboard-text-muted">Video linked</span>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-dashboard-text-muted/40">
                          <ImageIcon className="h-10 w-10" />
                          <span className="text-sm">No image yet</span>
                        </div>
                      )}
                      {featuredSermon?.tag && (
                        <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow">
                          {featuredSermon.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core fields */}
                  <div className="min-w-0 flex-1 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Title">
                        <CmsInput
                          value={featuredSermon?.title ?? ""}
                          onChange={(e) => setFeaturedSermon((p) => p ? { ...p, title: e.target.value } : null)}
                          placeholder="When God Feels Distant"
                        />
                      </Field>
                      <Field label="Series / Tag">
                        <CmsInput
                          value={featuredSermon?.tag ?? ""}
                          onChange={(e) => setFeaturedSermon((p) => p ? { ...p, tag: e.target.value || null } : null)}
                          placeholder="Current Series · Week 4"
                        />
                      </Field>
                    </div>
                    <Field label="Description">
                      <CmsTextarea
                        rows={4}
                        value={featuredSermon?.description ?? ""}
                        onChange={(e) => setFeaturedSermon((p) => p ? { ...p, description: e.target.value || null } : null)}
                        placeholder="Pastor David walks us through a season of uncertainty and shows us how to anchor our faith…"
                      />
                    </Field>
                  </div>
                </div>

                {/* Media & metadata */}
                <SubSection title="Media & Details">
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Image URL" hint="Thumbnail for the sermon card">
                      <CmsInput icon={ImageIcon} value={featuredSermon?.image_url ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, image_url: e.target.value || null } : null)} placeholder="https://…" />
                    </Field>
                    <Field label="Video URL" hint="YouTube or direct MP4 link">
                      <CmsInput icon={Video} value={featuredSermon?.video_url ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, video_url: e.target.value || null } : null)} placeholder="https://…" />
                    </Field>
                    <Field label="Audio URL">
                      <CmsInput icon={FileAudio} value={featuredSermon?.audio_url ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, audio_url: e.target.value || null } : null)} placeholder="https://…" />
                    </Field>
                    <Field label="Speaker Name">
                      <CmsInput icon={User} value={featuredSermon?.speaker_name ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, speaker_name: e.target.value || null } : null)} placeholder="Pastor David Mercer" />
                    </Field>
                    <Field label="Duration (minutes)">
                      <CmsInput icon={Clock} type="number" value={featuredSermon?.duration_minutes ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null } : null)} placeholder="47" />
                    </Field>
                  </div>
                </SubSection>

                {/* Save bar */}
                <div className="flex items-center justify-between border-t border-dashboard-border pt-5">
                  <p className="text-sm text-dashboard-text-muted">Changes are published to your website immediately on save.</p>
                  <SaveButton saving={saving} savingKey="sermon" onClick={saveFeaturedSermon} label="Save Sermon" />
                </div>
              </div>
            </div>
          )
        )}

        {/* ═══ PODCAST ═══ */}
        {activeCategory === "podcast" && (
          podcastLoading ? <SectionSkeleton /> : (
            <div className="space-y-7">
              <div>
                <h2 className="text-2xl font-bold text-dashboard-text">Podcast</h2>
                <p className="mt-1.5 text-sm text-dashboard-text-muted">
                  Manage your podcast settings and episode listings.
                </p>
              </div>

              {/* Settings card */}
              <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 space-y-6">
                <div className="flex items-center gap-2.5">
                  <Radio className="h-5 w-5 text-purple-400" />
                  <h3 className="text-base font-bold text-dashboard-text">Podcast Settings</h3>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Podcast Title">
                    <CmsInput value={podcastConfig?.title ?? ""} onChange={(e) => setPodcastConfig((p) => p ? { ...p, title: e.target.value } : null)} placeholder="Grace Daily Podcast" />
                  </Field>
                  <div />
                  <Field label="Description" className="sm:col-span-2">
                    <CmsTextarea rows={3} value={podcastConfig?.description ?? ""} onChange={(e) => setPodcastConfig((p) => p ? { ...p, description: e.target.value || null } : null)} placeholder="Short daily devotionals from Grace Church…" />
                  </Field>
                </div>

                <SubSection title="Platform Links">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field label="Spotify">
                      <CmsInput icon={LinkIcon} value={podcastConfig?.spotify_url ?? ""} onChange={(e) => setPodcastConfig((p) => p ? { ...p, spotify_url: e.target.value || null } : null)} placeholder="https://open.spotify.com/…" />
                    </Field>
                    <Field label="Apple Podcasts">
                      <CmsInput icon={LinkIcon} value={podcastConfig?.apple_podcasts_url ?? ""} onChange={(e) => setPodcastConfig((p) => p ? { ...p, apple_podcasts_url: e.target.value || null } : null)} placeholder="https://podcasts.apple.com/…" />
                    </Field>
                    <Field label="YouTube">
                      <CmsInput icon={LinkIcon} value={podcastConfig?.youtube_url ?? ""} onChange={(e) => setPodcastConfig((p) => p ? { ...p, youtube_url: e.target.value || null } : null)} placeholder="https://youtube.com/…" />
                    </Field>
                  </div>
                </SubSection>

                <div className="flex justify-end border-t border-dashboard-border pt-5">
                  <SaveButton saving={saving} savingKey="podcast-config" onClick={savePodcastConfig} label="Save Settings" />
                </div>
              </div>

              {/* Episodes card */}
              <div className="rounded-2xl border border-dashboard-border bg-dashboard-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <h3 className="text-base font-bold text-dashboard-text">Episodes</h3>
                    <span className="rounded-lg bg-purple-500/15 px-2.5 py-1 text-xs font-bold text-purple-300">
                      {podcastEpisodes?.length ?? 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addPodcastEpisode}
                    disabled={!!saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card-hover px-4 py-2.5 text-sm font-semibold text-dashboard-text transition-all hover:border-dashboard-border-light disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Episode
                  </button>
                </div>

                {!podcastEpisodes || podcastEpisodes.length === 0 ? (
                  <EmptyState icon={Mic} color="text-purple-400" bg="bg-purple-500/15" title="No episodes yet" description="Add your first podcast episode to display on your website." />
                ) : (
                  <div className="space-y-4">
                    {podcastEpisodes.map((ep) => (
                      <div key={ep.id} className="group rounded-2xl border border-dashboard-border bg-dashboard-card-hover/40 p-5 transition-all hover:border-dashboard-border-light">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
                            <span className="text-sm font-extrabold text-purple-400">#{ep.episode_number}</span>
                          </div>
                          <div className="min-w-0 flex-1 space-y-4">
                            <input
                              value={ep.title}
                              onChange={(e) => patchPodcastEpisode(ep.id, { title: e.target.value })}
                              placeholder="Episode title"
                              className="w-full bg-transparent text-base font-bold text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none"
                            />
                            <div className="grid gap-4 sm:grid-cols-3">
                              <Field label="Publish Date">
                                <CmsInput type="date" value={ep.published_at ? ep.published_at.slice(0, 10) : ""} onChange={(e) => patchPodcastEpisode(ep.id, { published_at: e.target.value || null })} />
                              </Field>
                              <Field label="Duration (minutes)">
                                <CmsInput type="number" value={ep.duration_minutes ?? ""} onChange={(e) => patchPodcastEpisode(ep.id, { duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="32" />
                              </Field>
                              <Field label="Audio URL">
                                <CmsInput icon={FileAudio} value={ep.audio_url ?? ""} onChange={(e) => patchPodcastEpisode(ep.id, { audio_url: e.target.value || null })} placeholder="https://…" />
                              </Field>
                            </div>
                          </div>
                          <DeleteBtn onClick={() => deletePodcastEpisode(ep.id)} disabled={!!saving} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* ═══ SERMON ARCHIVE ═══ */}
        {activeCategory === "archive" && (
          archiveLoading ? <SectionSkeleton /> : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-dashboard-text">Sermon Archive</h2>
                  <p className="mt-1.5 text-sm text-dashboard-text-muted">
                    Past sermons shown in the sermon grid on your Media page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSermonArchive}
                  disabled={!!saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Sermon
                </button>
              </div>

              {!sermonArchive || sermonArchive.length === 0 ? (
                <EmptyState
                  icon={BookOpen} color="text-emerald-400" bg="bg-emerald-500/15"
                  title="No sermons yet"
                  description="Add past sermons with video or audio links to build your sermon archive."
                  action={
                    <button type="button" onClick={addSermonArchive} disabled={!!saving} className="inline-flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-5 py-2.5 text-sm font-semibold text-dashboard-text transition-all hover:border-dashboard-border-light">
                      <Plus className="h-4 w-4" />Add your first sermon
                    </button>
                  }
                />
              ) : (
                <div className="space-y-5">
                  {sermonArchive.map((s) => (
                    <div key={s.id} className="group rounded-2xl border border-dashboard-border bg-dashboard-card p-5 transition-all hover:border-dashboard-border-light">
                      <div className="flex gap-5">
                        {/* Thumbnail */}
                        <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-card-hover/50">
                          {s.image_url ? (
                            <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                          ) : s.video_url ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2">
                              <PlayCircle className="h-7 w-7 text-emerald-500/60" />
                              <span className="text-xs text-dashboard-text-muted">Video linked</span>
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="h-7 w-7 text-dashboard-text-muted/30" />
                            </div>
                          )}
                          {s.tag && (
                            <span className="absolute left-2 top-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              {s.tag}
                            </span>
                          )}
                        </div>

                        {/* Fields */}
                        <div className="min-w-0 flex-1 space-y-4">
                          <div className="flex gap-3">
                            <input
                              className="flex-1 bg-transparent text-base font-bold text-dashboard-text placeholder:text-dashboard-text-muted/50 focus:outline-none"
                              value={s.title}
                              onChange={(e) => patchSermonArchive(s.id, { title: e.target.value })}
                              placeholder="Sermon title"
                            />
                            <CmsInput
                              className="w-36 text-sm"
                              value={s.tag ?? ""}
                              onChange={(e) => patchSermonArchive(s.id, { tag: e.target.value || null })}
                              placeholder="Series tag"
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Field label="Image URL">
                              <CmsInput value={s.image_url ?? ""} onChange={(e) => patchSermonArchive(s.id, { image_url: e.target.value || null })} placeholder="https://…" />
                            </Field>
                            <Field label="Date">
                              <CmsInput type="date" value={s.published_at ? s.published_at.slice(0, 10) : ""} onChange={(e) => patchSermonArchive(s.id, { published_at: e.target.value || null })} />
                            </Field>
                            <Field label="Duration (min)">
                              <CmsInput type="number" value={s.duration_minutes ?? ""} onChange={(e) => patchSermonArchive(s.id, { duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="45" />
                            </Field>
                            <Field label="Speaker">
                              <CmsInput value={s.speaker_name ?? ""} onChange={(e) => patchSermonArchive(s.id, { speaker_name: e.target.value || null })} placeholder="Speaker name" />
                            </Field>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Video URL">
                              <CmsInput icon={Video} value={s.video_url ?? ""} onChange={(e) => patchSermonArchive(s.id, { video_url: e.target.value || null })} placeholder="https://…" />
                            </Field>
                            <Field label="Audio URL">
                              <CmsInput icon={FileAudio} value={s.audio_url ?? ""} onChange={(e) => patchSermonArchive(s.id, { audio_url: e.target.value || null })} placeholder="https://…" />
                            </Field>
                          </div>
                        </div>

                        <DeleteBtn onClick={() => deleteSermonArchive(s.id)} disabled={!!saving} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* ═══ WORSHIP ═══ */}
        {activeCategory === "worship" && (
          worshipLoading ? <SectionSkeleton /> : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-dashboard-text">Worship Recordings</h2>
                  <p className="mt-1.5 text-sm text-dashboard-text-muted">
                    Live worship songs and recordings for your Media page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addWorshipRecording}
                  disabled={!!saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rose-500 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Recording
                </button>
              </div>

              {!worshipRecordings || worshipRecordings.length === 0 ? (
                <EmptyState
                  icon={Music} color="text-rose-400" bg="bg-rose-500/15"
                  title="No recordings yet"
                  description="Add worship recordings with audio or video links to display on your Media page."
                  action={
                    <button type="button" onClick={addWorshipRecording} disabled={!!saving} className="inline-flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-5 py-2.5 text-sm font-semibold text-dashboard-text transition-all hover:border-dashboard-border-light">
                      <Plus className="h-4 w-4" />Add your first recording
                    </button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {worshipRecordings.map((rec) => (
                    <div key={rec.id} className="group rounded-2xl border border-dashboard-border bg-dashboard-card p-5 transition-all hover:border-dashboard-border-light">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
                          <Music className="h-5 w-5 text-rose-400" />
                        </div>
                        <div className="min-w-0 flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <Field label="Song Title">
                            <CmsInput value={rec.title} onChange={(e) => patchWorshipRecording(rec.id, { title: e.target.value })} placeholder="Amazing Grace" className="font-semibold" />
                          </Field>
                          <Field label="Subtitle">
                            <CmsInput value={rec.subtitle ?? ""} onChange={(e) => patchWorshipRecording(rec.id, { subtitle: e.target.value || null })} placeholder="Feb 9 · Live" />
                          </Field>
                          <Field label="Duration">
                            <CmsInput value={rec.duration_text ?? ""} onChange={(e) => patchWorshipRecording(rec.id, { duration_text: e.target.value || null })} placeholder="6:14" />
                          </Field>
                          <Field label="Audio / Video URL">
                            <CmsInput icon={LinkIcon} value={rec.url ?? ""} onChange={(e) => patchWorshipRecording(rec.id, { url: e.target.value || null })} placeholder="https://…" />
                          </Field>
                        </div>
                        <DeleteBtn onClick={() => deleteWorshipRecording(rec.id)} disabled={!!saving} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

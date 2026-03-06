"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
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

/* ─────────────────────────────────────────────────────
   CATEGORY CONFIG
───────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: "events",   label: "Events",          icon: Calendar, iconColor: "text-blue-400",    iconBg: "bg-blue-500/15",   pill: "bg-blue-500/15 text-blue-300",   accentBorder: "border-blue-500/40"   },
  { id: "featured", label: "Featured Sermon", icon: Star,     iconColor: "text-amber-400",   iconBg: "bg-amber-500/15",  pill: "bg-amber-500/15 text-amber-300", accentBorder: "border-amber-500/40"  },
  { id: "podcast",  label: "Podcast",         icon: Mic,      iconColor: "text-purple-400",  iconBg: "bg-purple-500/15", pill: "bg-purple-500/15 text-purple-300",accentBorder: "border-purple-500/40" },
  { id: "archive",  label: "Sermon Archive",  icon: BookOpen, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/15",pill: "bg-emerald-500/15 text-emerald-300",accentBorder: "border-emerald-500/40"},
  { id: "worship",  label: "Worship",         icon: Music,    iconColor: "text-rose-400",    iconBg: "bg-rose-500/15",   pill: "bg-rose-500/15 text-rose-300",   accentBorder: "border-rose-500/40"   },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

/* ─────────────────────────────────────────────────────
   SHARED DESIGN PRIMITIVES
   All sections use these — nothing is one-off.
───────────────────────────────────────────────────── */

/** Page-level section header: big title + description + optional action */
function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-dashboard-text">{title}</h2>
        <p className="mt-1.5 text-sm text-dashboard-text-muted">{description}</p>
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </div>
  );
}

/** Outer card wrapper — every content section lives inside one of these */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-dashboard-border bg-dashboard-card", className)}>
      {children}
    </div>
  );
}

/** Card section header bar (inside a Card) */
function CardHeader({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  badge,
  action,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashboard-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-4.5 h-[18px] w-[18px]", iconColor)} />
        </div>
        <span className="text-base font-bold text-dashboard-text">{title}</span>
        {badge}
      </div>
      {action}
    </div>
  );
}

/** Inner tinted block for grouped sub-fields */
function FieldBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/40 p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-dashboard-text-muted/60">{title}</p>
      {children}
    </div>
  );
}

/** A single row item inside a list (episode, recording, sermon card) */
function ItemRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 p-5 transition-colors hover:border-dashboard-border-light hover:bg-dashboard-card-hover/50", className)}>
      {children}
    </div>
  );
}

/** Consistent field label + optional hint */
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
      <p className="mb-1.5 text-sm font-semibold text-dashboard-text">{label}</p>
      {hint && <p className="mb-1.5 text-xs text-dashboard-text-muted">{hint}</p>}
      {children}
    </div>
  );
}

/** All inputs look the same */
const inputCls =
  "w-full rounded-xl border border-dashboard-border bg-dashboard-card-hover/50 px-4 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/40 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40";

function CmsInput({
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ElementType }) {
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dashboard-text-muted/50" />
        <input {...props} className={cn(inputCls, "pl-10", className)} />
      </div>
    );
  }
  return <input {...props} className={cn(inputCls, className)} />;
}

function CmsTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(inputCls, "resize-none leading-relaxed", className)}
    />
  );
}

/** Primary action button (add / create) */
function PrimaryBtn({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

/** Outline action button (secondary) */
function OutlineBtn({
  children,
  onClick,
  disabled,
  asChild,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  asChild?: boolean;
  href?: string;
}) {
  const cls =
    "inline-flex items-center gap-2 rounded-xl border border-dashboard-border bg-dashboard-card px-4 py-2.5 text-sm font-semibold text-dashboard-text-muted transition-all hover:border-dashboard-border-light hover:text-dashboard-text disabled:opacity-50";
  if (href) {
    return <Link href={href} className={cls}>{children}</Link>;
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/** Save / saved / saving button */
function SaveBtn({
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
      const t = setTimeout(() => setJustSaved(false), 2200);
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
      {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
        : justSaved ? <><Check className="h-4 w-4" />Saved!</>
        : label}
    </button>
  );
}

/** Delete icon button — only visible on group-hover */
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

/** Count pill badge */
function CountPill({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn("flex h-6 min-w-[26px] items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums", className)}>
      {count}
    </span>
  );
}

/** Empty state — same layout every time, only icon/color/text varies */
function EmptyState({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className={cn("mb-5 flex h-16 w-16 items-center justify-center rounded-2xl", iconBg)}>
        <Icon className={cn("h-8 w-8", iconColor)} />
      </div>
      <p className="text-base font-bold text-dashboard-text">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-dashboard-text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Loading skeleton */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-9 w-56 rounded-xl bg-dashboard-card-hover" />
      <div className="h-5 w-80 rounded-lg bg-dashboard-card-hover/70" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-56 rounded-2xl bg-dashboard-card-hover" />)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────── */

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
    fetch(`/api/events?${org}`, base).then((r) => r.json()).then((d) => setEvents(Array.isArray(d) ? d : [])).catch(() => setEvents([])).finally(() => setEventsLoading(false));

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
    fetch(`/api/website-cms/sermon-archive?${org}`, base).then((r) => r.json()).then((d) => setSermonArchive(Array.isArray(d) ? d : [])).catch(() => setSermonArchive([])).finally(() => setArchiveLoading(false));

    setWorshipLoading(true);
    fetch(`/api/website-cms/worship-recordings?${org}`, base).then((r) => r.json()).then((d) => setWorshipRecordings(Array.isArray(d) ? d : [])).catch(() => setWorshipRecordings([])).finally(() => setWorshipLoading(false));

    fetchedRef.current = new Set(["events", "featured", "podcast", "archive", "worship"]);
  }, [organizationId]);

  /* CRUD */
  const saveFeaturedSermon = useCallback(async () => {
    if (!featuredSermon) return;
    setSaving("sermon");
    try { await fetch("/api/website-cms/featured-sermon", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, ...featuredSermon }), credentials: "include" }); }
    finally { setSaving(null); }
  }, [featuredSermon, organizationId]);

  const savePodcastConfig = useCallback(async () => {
    if (!podcastConfig) return;
    setSaving("podcast-config");
    try { await fetch("/api/website-cms/podcast-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, ...podcastConfig }), credentials: "include" }); }
    finally { setSaving(null); }
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

  /* ─── RENDER ─── */
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

      {/* ── SIDEBAR ── */}
      <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
        <div className="sticky top-24 space-y-2">

          {/* Stats */}
          <Card className="mb-4 p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-dashboard-text-muted/60">Overview</p>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-4xl font-black tabular-nums text-dashboard-text">{totalItems}</p>
                <p className="mt-0.5 text-sm text-dashboard-text-muted">total items</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums text-dashboard-text">
                  {filledTypes}<span className="text-lg font-normal text-dashboard-text-muted">/{CATEGORIES.length}</span>
                </p>
                <p className="mt-0.5 text-sm text-dashboard-text-muted">types active</p>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-dashboard-card-hover">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${(filledTypes / CATEGORIES.length) * 100}%` }} />
            </div>
          </Card>

          {/* Nav */}
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all",
                  isActive
                    ? "border-dashboard-border bg-dashboard-card shadow-sm"
                    : "border-transparent text-dashboard-text-muted hover:bg-dashboard-card/60 hover:text-dashboard-text"
                )}
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors", isActive ? cat.iconBg : "bg-dashboard-card-hover group-hover:bg-dashboard-card")}>
                  <Icon className={cn("h-[18px] w-[18px]", isActive ? cat.iconColor : "text-dashboard-text-muted/70 group-hover:text-dashboard-text-muted")} />
                </div>
                <span className={cn("flex-1 text-sm font-semibold", isActive ? "text-dashboard-text" : "group-hover:text-dashboard-text")}>
                  {cat.label}
                </span>
                <CountPill count={counts[cat.id]} className={isActive ? cat.pill : "bg-dashboard-card-hover text-dashboard-text-muted"} />
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="min-w-0 flex-1 space-y-6">

        {/* Mobile tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
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
                  isActive ? cn("border-transparent", cat.iconBg, cat.iconColor) : "border-dashboard-border bg-dashboard-card text-dashboard-text-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
                {counts[cat.id] > 0 && <span className="opacity-60">· {counts[cat.id]}</span>}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════
            EVENTS
        ══════════════════════════════════════════════ */}
        {activeCategory === "events" && (
          eventsLoading ? <Skeleton /> : (
            <div className="space-y-6">
              <SectionTitle
                title="Events"
                description="Upcoming events synced from your Events dashboard — manage and create them there."
                action={
                  <>
                    <OutlineBtn href="/dashboard/events">Manage Events</OutlineBtn>
                    <Link href="/dashboard/events/new" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500">
                      <Plus className="h-4 w-4" />
                      Create Event
                    </Link>
                  </>
                }
              />

              {!events || events.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={Calendar} iconColor="text-blue-400" iconBg="bg-blue-500/15"
                    title="No upcoming events"
                    description="Create events in the Events dashboard — they'll automatically appear on your website."
                    action={<OutlineBtn href="/dashboard/events/new"><Plus className="h-4 w-4" />Create your first event</OutlineBtn>}
                  />
                </Card>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((e) => {
                    const d = new Date(e.start_at);
                    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                    const day = d.getDate();
                    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                    const img = e.image_url || "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=700";
                    return (
                      <Card key={e.id} className="group overflow-hidden transition-all hover:border-dashboard-border-light hover:shadow-lg">
                        <div className="relative h-40 overflow-hidden">
                          <img src={img} alt={e.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <div className="absolute bottom-3 left-3">
                            <div className="flex flex-col items-center rounded-xl bg-white/95 dark:bg-[#181c26]/95 px-3 py-1.5 shadow-lg backdrop-blur-sm min-w-[44px]">
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
                          <h3 className="text-base font-bold leading-snug text-dashboard-text">{e.name}</h3>
                          {e.description && (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-dashboard-text-muted">{e.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-dashboard-text-muted">
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0" />{time}</span>
                            {e.venue_name && <span className="truncate">{e.venue_name}</span>}
                          </div>
                          <div className="mt-4 border-t border-dashboard-border pt-3">
                            <Link href={`/dashboard/events/${e.id}/edit`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500 transition-colors hover:text-emerald-400">
                              <ExternalLink className="h-3.5 w-3.5" />Edit event details
                            </Link>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════
            FEATURED SERMON
        ══════════════════════════════════════════════ */}
        {activeCategory === "featured" && (
          featuredLoading ? <Skeleton /> : (
            <div className="space-y-6">
              <SectionTitle
                title="Featured Sermon"
                description="The hero sermon displayed prominently on your Media page."
              />

              <Card>
                <CardHeader icon={Star} iconColor="text-amber-400" iconBg="bg-amber-500/15" title="Sermon Details" />
                <div className="p-6 space-y-6">
                  {/* Preview + primary fields */}
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="lg:w-64 shrink-0">
                      <p className="mb-2 text-sm font-semibold text-dashboard-text">Thumbnail Preview</p>
                      <div className="relative h-44 overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-card-hover/50">
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
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Title">
                          <CmsInput value={featuredSermon?.title ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, title: e.target.value } : null)} placeholder="When God Feels Distant" />
                        </Field>
                        <Field label="Series / Tag">
                          <CmsInput value={featuredSermon?.tag ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, tag: e.target.value || null } : null)} placeholder="Current Series · Week 4" />
                        </Field>
                      </div>
                      <Field label="Description">
                        <CmsTextarea rows={4} value={featuredSermon?.description ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, description: e.target.value || null } : null)} placeholder="Pastor David walks us through a season of uncertainty…" />
                      </Field>
                    </div>
                  </div>

                  {/* Media & metadata */}
                  <FieldBlock title="Media & Details">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Image URL" hint="Thumbnail for the sermon card">
                        <CmsInput icon={ImageIcon} value={featuredSermon?.image_url ?? ""} onChange={(e) => setFeaturedSermon((p) => p ? { ...p, image_url: e.target.value || null } : null)} placeholder="https://…" />
                      </Field>
                      <Field label="Video URL" hint="YouTube or direct MP4">
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
                  </FieldBlock>

                  {/* Save bar */}
                  <div className="flex items-center justify-between border-t border-dashboard-border pt-5">
                    <p className="text-sm text-dashboard-text-muted">Changes are published to your website immediately on save.</p>
                    <SaveBtn saving={saving} savingKey="sermon" onClick={saveFeaturedSermon} label="Save Sermon" />
                  </div>
                </div>
              </Card>
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════
            PODCAST
        ══════════════════════════════════════════════ */}
        {activeCategory === "podcast" && (
          podcastLoading ? <Skeleton /> : (
            <div className="space-y-6">
              <SectionTitle
                title="Podcast"
                description="Manage your podcast settings and episode listings."
              />

              {/* Settings card */}
              <Card>
                <CardHeader icon={Radio} iconColor="text-purple-400" iconBg="bg-purple-500/15" title="Podcast Settings" />
                <div className="p-6 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Podcast Title">
                      <CmsInput value={podcastConfig?.title ?? ""} onChange={(e) => setPodcastConfig((p) => p ? { ...p, title: e.target.value } : null)} placeholder="Grace Daily Podcast" />
                    </Field>
                    <div />
                    <Field label="Description" className="sm:col-span-2">
                      <CmsTextarea rows={3} value={podcastConfig?.description ?? ""} onChange={(e) => setPodcastConfig((p) => p ? { ...p, description: e.target.value || null } : null)} placeholder="Short daily devotionals from Grace Church…" />
                    </Field>
                  </div>
                  <FieldBlock title="Platform Links">
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
                  </FieldBlock>
                  <div className="flex justify-end border-t border-dashboard-border pt-5">
                    <SaveBtn saving={saving} savingKey="podcast-config" onClick={savePodcastConfig} label="Save Settings" />
                  </div>
                </div>
              </Card>

              {/* Episodes card */}
              <Card>
                <CardHeader
                  icon={Sparkles}
                  iconColor="text-purple-400"
                  iconBg="bg-purple-500/15"
                  title="Episodes"
                  badge={<CountPill count={podcastEpisodes?.length ?? 0} className="bg-purple-500/15 text-purple-300" />}
                  action={<OutlineBtn onClick={addPodcastEpisode} disabled={!!saving}><Plus className="h-4 w-4" />Add Episode</OutlineBtn>}
                />
                <div className="p-6">
                  {!podcastEpisodes || podcastEpisodes.length === 0 ? (
                    <EmptyState icon={Mic} iconColor="text-purple-400" iconBg="bg-purple-500/15" title="No episodes yet" description="Add your first podcast episode to display on your website." />
                  ) : (
                    <div className="space-y-3">
                      {podcastEpisodes.map((ep) => (
                        <ItemRow key={ep.id}>
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
                              <span className="text-sm font-extrabold text-purple-400">#{ep.episode_number}</span>
                            </div>
                            <div className="min-w-0 flex-1 space-y-4">
                              <CmsInput
                                value={ep.title}
                                onChange={(e) => patchPodcastEpisode(ep.id, { title: e.target.value })}
                                placeholder="Episode title"
                                className="border-0 bg-transparent px-0 text-base font-bold shadow-none focus:ring-0"
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
                        </ItemRow>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════
            SERMON ARCHIVE
        ══════════════════════════════════════════════ */}
        {activeCategory === "archive" && (
          archiveLoading ? <Skeleton /> : (
            <div className="space-y-6">
              <SectionTitle
                title="Sermon Archive"
                description="Past sermons shown in the sermon grid on your Media page."
                action={<PrimaryBtn onClick={addSermonArchive} disabled={!!saving}><Plus className="h-4 w-4" />Add Sermon</PrimaryBtn>}
              />

              <Card>
                <CardHeader
                  icon={BookOpen}
                  iconColor="text-emerald-400"
                  iconBg="bg-emerald-500/15"
                  title="Sermons"
                  badge={<CountPill count={sermonArchive?.length ?? 0} className="bg-emerald-500/15 text-emerald-300" />}
                  action={<OutlineBtn onClick={addSermonArchive} disabled={!!saving}><Plus className="h-4 w-4" />Add Sermon</OutlineBtn>}
                />
                <div className="p-6">
                  {!sermonArchive || sermonArchive.length === 0 ? (
                    <EmptyState
                      icon={BookOpen} iconColor="text-emerald-400" iconBg="bg-emerald-500/15"
                      title="No sermons yet"
                      description="Add past sermons with video or audio links to build your sermon archive."
                      action={<OutlineBtn onClick={addSermonArchive} disabled={!!saving}><Plus className="h-4 w-4" />Add your first sermon</OutlineBtn>}
                    />
                  ) : (
                    <div className="space-y-4">
                      {sermonArchive.map((s) => (
                        <ItemRow key={s.id}>
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
                              {/* Title row */}
                              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                                <Field label="Title">
                                  <CmsInput value={s.title} onChange={(e) => patchSermonArchive(s.id, { title: e.target.value })} placeholder="Sermon title" className="font-semibold" />
                                </Field>
                                <Field label="Series Tag">
                                  <CmsInput value={s.tag ?? ""} onChange={(e) => patchSermonArchive(s.id, { tag: e.target.value || null })} placeholder="Series tag" className="w-36" />
                                </Field>
                              </div>
                              {/* Meta row */}
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
                              {/* Media row */}
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
                        </ItemRow>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════
            WORSHIP
        ══════════════════════════════════════════════ */}
        {activeCategory === "worship" && (
          worshipLoading ? <Skeleton /> : (
            <div className="space-y-6">
              <SectionTitle
                title="Worship Recordings"
                description="Live worship songs and recordings for your Media page."
                action={<PrimaryBtn onClick={addWorshipRecording} disabled={!!saving} className="bg-rose-600 hover:bg-rose-500"><Plus className="h-4 w-4" />Add Recording</PrimaryBtn>}
              />

              <Card>
                <CardHeader
                  icon={Music}
                  iconColor="text-rose-400"
                  iconBg="bg-rose-500/15"
                  title="Recordings"
                  badge={<CountPill count={worshipRecordings?.length ?? 0} className="bg-rose-500/15 text-rose-300" />}
                  action={<OutlineBtn onClick={addWorshipRecording} disabled={!!saving}><Plus className="h-4 w-4" />Add Recording</OutlineBtn>}
                />
                <div className="p-6">
                  {!worshipRecordings || worshipRecordings.length === 0 ? (
                    <EmptyState
                      icon={Music} iconColor="text-rose-400" iconBg="bg-rose-500/15"
                      title="No recordings yet"
                      description="Add worship recordings with audio or video links to display on your Media page."
                      action={<OutlineBtn onClick={addWorshipRecording} disabled={!!saving}><Plus className="h-4 w-4" />Add your first recording</OutlineBtn>}
                    />
                  ) : (
                    <div className="space-y-3">
                      {worshipRecordings.map((rec) => (
                        <ItemRow key={rec.id}>
                          <div className="flex items-start gap-4">
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
                        </ItemRow>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )
        )}
      </div>
    </div>
  );
}

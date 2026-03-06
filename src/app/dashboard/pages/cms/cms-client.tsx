"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  AlertCircle,
  ChevronRight,
  LayoutGrid,
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
  { id: "events", label: "Events", icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", activeBg: "bg-blue-500/15", ring: "ring-blue-500/30" },
  { id: "featured", label: "Featured Sermon", icon: Star, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", activeBg: "bg-amber-500/15", ring: "ring-amber-500/30" },
  { id: "podcast", label: "Podcast", icon: Mic, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", activeBg: "bg-purple-500/15", ring: "ring-purple-500/30" },
  { id: "archive", label: "Sermon Archive", icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", activeBg: "bg-emerald-500/15", ring: "ring-emerald-500/30" },
  { id: "worship", label: "Worship", icon: Music, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", activeBg: "bg-rose-500/15", ring: "ring-rose-500/30" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

/* ── Micro-components ── */

function SectionHeader({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  action,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-dashboard-border">
      <div className="flex items-center gap-3.5">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-dashboard-text">{title}</h2>
          <p className="text-xs text-dashboard-text-muted mt-0.5">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyBlock({
  icon: Icon,
  title,
  description,
  action,
  color = "text-dashboard-text-muted",
  bg = "bg-dashboard-card-hover",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-dashboard-card/30 px-6 py-14 text-center">
      <div className={cn("mb-4 flex h-14 w-14 items-center justify-center rounded-2xl", bg)}>
        <Icon className={cn("h-6 w-6 opacity-60", color)} />
      </div>
      <p className="text-sm font-semibold text-dashboard-text">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-dashboard-text-muted leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center gap-3.5 pb-5 border-b border-dashboard-border">
        <div className="h-10 w-10 rounded-xl bg-dashboard-card-hover" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 rounded bg-dashboard-card-hover" />
          <div className="h-3 w-52 rounded bg-dashboard-card-hover/60" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-52 rounded-2xl bg-dashboard-card-hover" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
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
    <Button
      onClick={() => {
        onClick();
        setJustSaved(true);
      }}
      disabled={!!saving}
      size="sm"
      className={cn(
        "relative overflow-hidden gap-2 font-medium transition-all",
        justSaved && !isSaving
          ? "bg-emerald-500 text-white hover:bg-emerald-500"
          : "bg-emerald-600 text-white hover:bg-emerald-500"
      )}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </>
      ) : justSaved ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Saved
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function FieldGroup({
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
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-dashboard-text-muted/80 mb-1.5">
        {label}
      </label>
      {hint && <p className="mb-1.5 text-[11px] text-dashboard-text-muted/60">{hint}</p>}
      {children}
    </div>
  );
}

function StyledInput({
  className,
  icon: Icon,
  ...props
}: React.ComponentProps<typeof Input> & { icon?: React.ElementType }) {
  if (Icon) {
    return (
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dashboard-text-muted/50 pointer-events-none" />
        <Input
          {...props}
          className={cn(
            "pl-9 rounded-lg border-dashboard-border bg-dashboard-card-hover/50 text-dashboard-text placeholder:text-dashboard-text-muted/40 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/40 transition-colors",
            className
          )}
        />
      </div>
    );
  }
  return (
    <Input
      {...props}
      className={cn(
        "rounded-lg border-dashboard-border bg-dashboard-card-hover/50 text-dashboard-text placeholder:text-dashboard-text-muted/40 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/40 transition-colors",
        className
      )}
    />
  );
}

function StyledTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover/50 px-3 py-2.5 text-sm text-dashboard-text placeholder:text-dashboard-text-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/40 transition-colors resize-none",
        className
      )}
    />
  );
}

function ItemCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-dashboard-border bg-dashboard-card/80 p-4 transition-all hover:border-dashboard-border-light hover:bg-dashboard-card",
        className
      )}
    >
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
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dashboard-text-muted/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function CountPill({ count, color = "bg-dashboard-card-hover text-dashboard-text-muted" }: { count: number; color?: string }) {
  return (
    <span className={cn("inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums", color)}>
      {count}
    </span>
  );
}

/* ── Main CMS Client ── */

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
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));

    setFeaturedLoading(true);
    fetch(`/api/website-cms/featured-sermon?${org}`, base)
      .then((r) => r.json())
      .then((data) =>
        setFeaturedSermon(
          data?.id
            ? data
            : { title: "Featured Sermon", tag: null, description: null, image_url: null, video_url: null, audio_url: null, duration_minutes: null, speaker_name: null }
        )
      )
      .catch(() =>
        setFeaturedSermon({ title: "Featured Sermon", tag: null, description: null, image_url: null, video_url: null, audio_url: null, duration_minutes: null, speaker_name: null })
      )
      .finally(() => setFeaturedLoading(false));

    setPodcastLoading(true);
    Promise.all([
      fetch(`/api/website-cms/podcast-config?${org}`, base).then((r) => r.json()),
      fetch(`/api/website-cms/podcast-episodes?${org}`, base).then((r) => r.json()),
    ])
      .then(([config, episodes]) => {
        setPodcastConfig(
          config?.organization_id
            ? config
            : { title: "Grace Daily Podcast", description: null, spotify_url: null, apple_podcasts_url: null, youtube_url: null }
        );
        setPodcastEpisodes(Array.isArray(episodes) ? episodes : []);
      })
      .catch(() => {
        setPodcastConfig({ title: "Grace Daily Podcast", description: null, spotify_url: null, apple_podcasts_url: null, youtube_url: null });
        setPodcastEpisodes([]);
      })
      .finally(() => setPodcastLoading(false));

    setArchiveLoading(true);
    fetch(`/api/website-cms/sermon-archive?${org}`, base)
      .then((r) => r.json())
      .then((data) => setSermonArchive(Array.isArray(data) ? data : []))
      .catch(() => setSermonArchive([]))
      .finally(() => setArchiveLoading(false));

    setWorshipLoading(true);
    fetch(`/api/website-cms/worship-recordings?${org}`, base)
      .then((r) => r.json())
      .then((data) => setWorshipRecordings(Array.isArray(data) ? data : []))
      .catch(() => setWorshipRecordings([]))
      .finally(() => setWorshipLoading(false));

    fetchedRef.current = new Set(["events", "featured", "podcast", "archive", "worship"]);
  }, [organizationId]);

  /* ── CRUD helpers ── */

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
    const eps = podcastEpisodes ?? [];
    const nextNum = eps.length ? Math.max(...eps.map((e) => e.episode_number)) + 1 : 1;
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
      setPodcastEpisodes((prev) => [data, ...(prev ?? [])]);
    } finally {
      setSaving(null);
    }
  }

  async function deletePodcastEpisode(id: string) {
    setSaving("podcast");
    try {
      const res = await fetch(`/api/website-cms/podcast-episodes/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setPodcastEpisodes((prev) => (prev ?? []).filter((e) => e.id !== id));
    } finally {
      setSaving(null);
    }
  }

  async function patchPodcastEpisode(id: string, updates: Partial<PodcastEpisode>) {
    setPodcastEpisodes((prev) => (prev ?? []).map((x) => (x.id === id ? { ...x, ...updates } : x)));
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
      setWorshipRecordings((prev) => [...(prev ?? []), data]);
    } finally {
      setSaving(null);
    }
  }

  async function deleteWorshipRecording(id: string) {
    setSaving("worship");
    try {
      const res = await fetch(`/api/website-cms/worship-recordings/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setWorshipRecordings((prev) => (prev ?? []).filter((e) => e.id !== id));
    } finally {
      setSaving(null);
    }
  }

  async function patchWorshipRecording(id: string, updates: Partial<WorshipRecording>) {
    setWorshipRecordings((prev) => (prev ?? []).map((x) => (x.id === id ? { ...x, ...updates } : x)));
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
      setSermonArchive((prev) => [...(prev ?? []), data]);
    } finally {
      setSaving(null);
    }
  }

  async function deleteSermonArchive(id: string) {
    setSaving("sermon-archive");
    try {
      const res = await fetch(`/api/website-cms/sermon-archive/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json()).error);
      setSermonArchive((prev) => (prev ?? []).filter((e) => e.id !== id));
    } finally {
      setSaving(null);
    }
  }

  async function patchSermonArchive(id: string, updates: Partial<SermonArchiveItem>) {
    setSermonArchive((prev) => (prev ?? []).map((x) => (x.id === id ? { ...x, ...updates } : x)));
    const res = await fetch(`/api/website-cms/sermon-archive/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    });
    if (!res.ok) console.error("Update failed");
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
  const activeCat = CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:block lg:w-60 xl:w-64 shrink-0">
        <div className="sticky top-24 space-y-1.5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-dashboard-text-muted/50">
            Content Types
          </p>

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
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                  isActive
                    ? "bg-dashboard-card text-dashboard-text shadow-sm ring-1 ring-dashboard-border"
                    : "text-dashboard-text-muted hover:bg-dashboard-card/60 hover:text-dashboard-text"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-all",
                    isActive ? cat.bg : "group-hover:bg-dashboard-card-hover"
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-colors", isActive ? cat.color : "text-dashboard-text-muted/60")} />
                </div>
                <span className="flex-1 truncate text-[13px]">{cat.label}</span>
                {count > 0 && (
                  <CountPill
                    count={count}
                    color={isActive ? cn(cat.bg, cat.color, "font-bold") : undefined}
                  />
                )}
              </button>
            );
          })}

          {/* Stats card */}
          <div className="mt-5 rounded-xl border border-dashboard-border bg-dashboard-card/60 p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-dashboard-text-muted/50">
              Overview
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dashboard-text-muted">Total items</span>
                <span className="text-sm font-bold tabular-nums text-dashboard-text">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dashboard-text-muted">Types filled</span>
                <span className="text-sm font-bold tabular-nums text-dashboard-text">
                  {filledTypes}
                  <span className="font-normal text-dashboard-text-muted">/{CATEGORIES.length}</span>
                </span>
              </div>
            </div>
            {filledTypes < CATEGORIES.length && (
              <div className="pt-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-dashboard-card-hover">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(filledTypes / CATEGORIES.length) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-dashboard-text-muted/60">
                  {CATEGORIES.length - filledTypes} type{CATEGORIES.length - filledTypes !== 1 ? "s" : ""} remaining
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="min-w-0 flex-1 space-y-5">

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
                  "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap",
                  isActive
                    ? cn("border-transparent text-white shadow-sm", cat.bg, cat.color)
                    : "border-dashboard-border bg-dashboard-card text-dashboard-text-muted hover:border-dashboard-border-light hover:text-dashboard-text"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
                {counts[cat.id] > 0 && (
                  <span className="opacity-60">({counts[cat.id]})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section panel */}
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-card shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">

            {/* ═══════════════ Events ═══════════════ */}
            {activeCategory === "events" && (
              <>
                {eventsLoading ? (
                  <SectionSkeleton />
                ) : (
                  <>
                    <SectionHeader
                      title="Events"
                      description="Upcoming events synced from your Events dashboard."
                      icon={Calendar}
                      iconColor="text-blue-400"
                      iconBg="bg-blue-500/10"
                      action={
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="rounded-lg border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text text-xs">
                            <Link href="/dashboard/events">Manage Events</Link>
                          </Button>
                          <Button size="sm" asChild className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5">
                            <Link href="/dashboard/events/new">
                              <Plus className="h-3.5 w-3.5" />
                              Create Event
                            </Link>
                          </Button>
                        </div>
                      }
                    />

                    {!events || events.length === 0 ? (
                      <EmptyBlock
                        icon={Calendar}
                        title="No upcoming events"
                        description="Create events in the Events dashboard — they'll automatically appear on your website."
                        color="text-blue-400"
                        bg="bg-blue-500/10"
                        action={
                          <Button variant="outline" size="sm" className="rounded-lg border-dashboard-border text-xs" asChild>
                            <Link href="/dashboard/events/new">
                              <Plus className="mr-1.5 h-3.5 w-3.5" />
                              Create your first event
                            </Link>
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
                              className="group overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-card/50 transition-all hover:border-dashboard-border-light hover:shadow-md"
                              style={{ animationDelay: `${idx * 60}ms` }}
                            >
                              <div className="relative h-32 overflow-hidden">
                                <img
                                  src={img}
                                  alt={e.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                <div className="absolute bottom-3 left-3">
                                  <div className="flex flex-col items-center rounded-lg bg-white/95 px-2 py-1 shadow-md dark:bg-[#181c26]/95 backdrop-blur-sm min-w-[36px]">
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600">{month}</span>
                                    <span className="text-lg font-black leading-tight text-dashboard-text">{day}</span>
                                  </div>
                                </div>
                                {e.category && (
                                  <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                                    {e.category}
                                  </span>
                                )}
                              </div>
                              <div className="p-3.5">
                                <h3 className="font-semibold text-sm text-dashboard-text leading-snug line-clamp-1">{e.name}</h3>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[11px] text-dashboard-text-muted">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {time}
                                  </span>
                                  {e.venue_name && (
                                    <span className="truncate max-w-[120px]">{e.venue_name}</span>
                                  )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-dashboard-border">
                                  <Link
                                    href={`/dashboard/events/${e.id}/edit`}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Edit event
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ═══════════════ Featured Sermon ═══════════════ */}
            {activeCategory === "featured" && (
              <>
                {featuredLoading ? (
                  <SectionSkeleton />
                ) : (
                  <>
                    <SectionHeader
                      title="Featured Sermon"
                      description="The hero sermon displayed prominently on your Media page."
                      icon={Star}
                      iconColor="text-amber-400"
                      iconBg="bg-amber-500/10"
                    />

                    <div className="space-y-6">
                      {/* Preview + core info */}
                      <div className="flex flex-col gap-5 lg:flex-row">
                        {/* Thumbnail preview */}
                        <div className="shrink-0 lg:w-64">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-dashboard-text-muted/50 mb-2">Preview</p>
                          <div className="relative h-40 w-full overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-card-hover/50">
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
                              <div className="flex h-full flex-col items-center justify-center gap-2 text-dashboard-text-muted/40">
                                <ImageIcon className="h-8 w-8" />
                                <span className="text-xs">No thumbnail yet</span>
                              </div>
                            )}
                            {featuredSermon?.tag && (
                              <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                {featuredSermon.tag}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Core fields */}
                        <div className="min-w-0 flex-1 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FieldGroup label="Title">
                              <StyledInput
                                value={featuredSermon?.title ?? ""}
                                onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, title: e.target.value } : null))}
                                placeholder="When God Feels Distant"
                              />
                            </FieldGroup>
                            <FieldGroup label="Series / Tag">
                              <StyledInput
                                value={featuredSermon?.tag ?? ""}
                                onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, tag: e.target.value || null } : null))}
                                placeholder="Current Series · Week 4"
                              />
                            </FieldGroup>
                          </div>
                          <FieldGroup label="Description">
                            <StyledTextarea
                              rows={3}
                              value={featuredSermon?.description ?? ""}
                              onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, description: e.target.value || null } : null))}
                              placeholder="Pastor David walks us through…"
                            />
                          </FieldGroup>
                        </div>
                      </div>

                      {/* Media + meta */}
                      <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-dashboard-text-muted/50 mb-3">Media & Details</p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <FieldGroup label="Image URL" hint="Thumbnail for the sermon card">
                            <StyledInput icon={ImageIcon} value={featuredSermon?.image_url ?? ""} onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, image_url: e.target.value || null } : null))} placeholder="https://…" />
                          </FieldGroup>
                          <FieldGroup label="Video URL" hint="YouTube or direct MP4">
                            <StyledInput icon={Video} value={featuredSermon?.video_url ?? ""} onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, video_url: e.target.value || null } : null))} placeholder="https://…" />
                          </FieldGroup>
                          <FieldGroup label="Audio URL">
                            <StyledInput icon={FileAudio} value={featuredSermon?.audio_url ?? ""} onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, audio_url: e.target.value || null } : null))} placeholder="https://…" />
                          </FieldGroup>
                          <FieldGroup label="Speaker">
                            <StyledInput icon={User} value={featuredSermon?.speaker_name ?? ""} onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, speaker_name: e.target.value || null } : null))} placeholder="Pastor David Mercer" />
                          </FieldGroup>
                          <FieldGroup label="Duration (minutes)">
                            <StyledInput icon={Clock} type="number" value={featuredSermon?.duration_minutes ?? ""} onChange={(e) => setFeaturedSermon((p) => (p ? { ...p, duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null } : null))} placeholder="47" />
                          </FieldGroup>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-dashboard-text-muted/60">Changes are published to your website on save.</p>
                        <SaveButton saving={saving} savingKey="sermon" onClick={saveFeaturedSermon} label="Save Sermon" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ═══════════════ Podcast ═══════════════ */}
            {activeCategory === "podcast" && (
              <>
                {podcastLoading ? (
                  <SectionSkeleton />
                ) : (
                  <>
                    <SectionHeader
                      title="Podcast"
                      description="Manage your podcast settings and episode listings."
                      icon={Mic}
                      iconColor="text-purple-400"
                      iconBg="bg-purple-500/10"
                    />

                    {/* Podcast settings */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Radio className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-dashboard-text-muted/60">Podcast Settings</span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldGroup label="Podcast Title">
                          <StyledInput
                            value={podcastConfig?.title ?? ""}
                            onChange={(e) => setPodcastConfig((p) => (p ? { ...p, title: e.target.value } : null))}
                            placeholder="Grace Daily Podcast"
                          />
                        </FieldGroup>
                        <div />
                        <FieldGroup label="Description" className="sm:col-span-2">
                          <StyledTextarea
                            rows={2}
                            value={podcastConfig?.description ?? ""}
                            onChange={(e) => setPodcastConfig((p) => (p ? { ...p, description: e.target.value || null } : null))}
                            placeholder="Short daily devotionals…"
                          />
                        </FieldGroup>
                      </div>

                      <div className="rounded-xl border border-dashboard-border bg-dashboard-card-hover/30 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-dashboard-text-muted/50 mb-3">Platform Links</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <FieldGroup label="Spotify">
                            <StyledInput icon={LinkIcon} value={podcastConfig?.spotify_url ?? ""} onChange={(e) => setPodcastConfig((p) => (p ? { ...p, spotify_url: e.target.value || null } : null))} placeholder="https://open.spotify.com/…" />
                          </FieldGroup>
                          <FieldGroup label="Apple Podcasts">
                            <StyledInput icon={LinkIcon} value={podcastConfig?.apple_podcasts_url ?? ""} onChange={(e) => setPodcastConfig((p) => (p ? { ...p, apple_podcasts_url: e.target.value || null } : null))} placeholder="https://podcasts.apple.com/…" />
                          </FieldGroup>
                          <FieldGroup label="YouTube">
                            <StyledInput icon={LinkIcon} value={podcastConfig?.youtube_url ?? ""} onChange={(e) => setPodcastConfig((p) => (p ? { ...p, youtube_url: e.target.value || null } : null))} placeholder="https://youtube.com/…" />
                          </FieldGroup>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <SaveButton saving={saving} savingKey="podcast-config" onClick={savePodcastConfig} label="Save Settings" />
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashboard-border" />

                    {/* Episodes */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-xs font-bold uppercase tracking-widest text-dashboard-text-muted/60">Episodes</span>
                          <CountPill
                            count={podcastEpisodes?.length ?? 0}
                            color="bg-purple-500/10 text-purple-400"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addPodcastEpisode}
                          disabled={!!saving}
                          className="rounded-lg border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text text-xs gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Episode
                        </Button>
                      </div>

                      {!podcastEpisodes || podcastEpisodes.length === 0 ? (
                        <EmptyBlock
                          icon={Mic}
                          title="No episodes yet"
                          description="Add your first podcast episode to display on your website."
                          color="text-purple-400"
                          bg="bg-purple-500/10"
                        />
                      ) : (
                        <div className="space-y-3">
                          {podcastEpisodes.map((ep) => (
                            <ItemCard key={ep.id}>
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                                  <span className="text-xs font-extrabold text-purple-400">#{ep.episode_number}</span>
                                </div>
                                <div className="min-w-0 flex-1 space-y-3">
                                  <StyledInput
                                    value={ep.title}
                                    onChange={(e) => patchPodcastEpisode(ep.id, { title: e.target.value })}
                                    placeholder="Episode title"
                                    className="border-0 bg-transparent px-0 text-sm font-semibold text-dashboard-text shadow-none focus-visible:ring-0 focus-visible:border-0"
                                  />
                                  <div className="grid gap-3 sm:grid-cols-3">
                                    <FieldGroup label="Date">
                                      <StyledInput
                                        type="date"
                                        value={ep.published_at ? ep.published_at.slice(0, 10) : ""}
                                        onChange={(e) => patchPodcastEpisode(ep.id, { published_at: e.target.value || null })}
                                      />
                                    </FieldGroup>
                                    <FieldGroup label="Duration (min)">
                                      <StyledInput
                                        type="number"
                                        value={ep.duration_minutes ?? ""}
                                        onChange={(e) => patchPodcastEpisode(ep.id, { duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null })}
                                        placeholder="32"
                                      />
                                    </FieldGroup>
                                    <FieldGroup label="Audio URL">
                                      <StyledInput
                                        value={ep.audio_url ?? ""}
                                        onChange={(e) => patchPodcastEpisode(ep.id, { audio_url: e.target.value || null })}
                                        placeholder="https://…"
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
                  </>
                )}
              </>
            )}

            {/* ═══════════════ Sermon Archive ═══════════════ */}
            {activeCategory === "archive" && (
              <>
                {archiveLoading ? (
                  <SectionSkeleton />
                ) : (
                  <>
                    <SectionHeader
                      title="Sermon Archive"
                      description="Past sermons shown in the sermon grid on your Media page."
                      icon={BookOpen}
                      iconColor="text-emerald-400"
                      iconBg="bg-emerald-500/10"
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addSermonArchive}
                          disabled={!!saving}
                          className="rounded-lg border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text text-xs gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Sermon
                        </Button>
                      }
                    />

                    {!sermonArchive || sermonArchive.length === 0 ? (
                      <EmptyBlock
                        icon={BookOpen}
                        title="No sermons yet"
                        description="Add past sermons with video or audio links to build your sermon archive."
                        color="text-emerald-400"
                        bg="bg-emerald-500/10"
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addSermonArchive}
                            disabled={!!saving}
                            className="rounded-lg border-dashboard-border text-xs gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add your first sermon
                          </Button>
                        }
                      />
                    ) : (
                      <div className="space-y-4">
                        {sermonArchive.map((s) => (
                          <ItemCard key={s.id}>
                            <div className="flex gap-4">
                              {/* Thumbnail */}
                              <div className="relative h-[88px] w-28 shrink-0 overflow-hidden rounded-lg border border-dashboard-border bg-dashboard-card-hover/50">
                                {s.image_url ? (
                                  <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                                ) : s.video_url ? (
                                  <div className="flex h-full flex-col items-center justify-center gap-1 text-dashboard-text-muted">
                                    <PlayCircle className="h-5 w-5 text-emerald-500/60" />
                                    <span className="text-[9px]">Video</span>
                                  </div>
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-dashboard-text-muted/30" />
                                  </div>
                                )}
                                {s.tag && (
                                  <span className="absolute left-1 top-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[8px] font-bold text-white leading-tight">
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
                                  <StyledInput
                                    className="w-32"
                                    value={s.tag ?? ""}
                                    onChange={(e) => patchSermonArchive(s.id, { tag: e.target.value || null })}
                                    placeholder="Series tag"
                                  />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <FieldGroup label="Image URL">
                                    <StyledInput value={s.image_url ?? ""} onChange={(e) => patchSermonArchive(s.id, { image_url: e.target.value || null })} placeholder="https://…" />
                                  </FieldGroup>
                                  <FieldGroup label="Date">
                                    <StyledInput type="date" value={s.published_at ? s.published_at.slice(0, 10) : ""} onChange={(e) => patchSermonArchive(s.id, { published_at: e.target.value || null })} />
                                  </FieldGroup>
                                  <FieldGroup label="Duration (min)">
                                    <StyledInput type="number" value={s.duration_minutes ?? ""} onChange={(e) => patchSermonArchive(s.id, { duration_minutes: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="45" />
                                  </FieldGroup>
                                  <FieldGroup label="Speaker">
                                    <StyledInput value={s.speaker_name ?? ""} onChange={(e) => patchSermonArchive(s.id, { speaker_name: e.target.value || null })} placeholder="Speaker name" />
                                  </FieldGroup>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <FieldGroup label="Video URL">
                                    <StyledInput icon={Video} value={s.video_url ?? ""} onChange={(e) => patchSermonArchive(s.id, { video_url: e.target.value || null })} placeholder="https://…" />
                                  </FieldGroup>
                                  <FieldGroup label="Audio URL">
                                    <StyledInput icon={FileAudio} value={s.audio_url ?? ""} onChange={(e) => patchSermonArchive(s.id, { audio_url: e.target.value || null })} placeholder="https://…" />
                                  </FieldGroup>
                                </div>
                              </div>

                              <DeleteButton onClick={() => deleteSermonArchive(s.id)} disabled={!!saving} />
                            </div>
                          </ItemCard>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ═══════════════ Worship Recordings ═══════════════ */}
            {activeCategory === "worship" && (
              <>
                {worshipLoading ? (
                  <SectionSkeleton />
                ) : (
                  <>
                    <SectionHeader
                      title="Worship Recordings"
                      description="Live worship songs and recordings for your Media page."
                      icon={Music}
                      iconColor="text-rose-400"
                      iconBg="bg-rose-500/10"
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addWorshipRecording}
                          disabled={!!saving}
                          className="rounded-lg border-dashboard-border text-dashboard-text-muted hover:text-dashboard-text text-xs gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Recording
                        </Button>
                      }
                    />

                    {!worshipRecordings || worshipRecordings.length === 0 ? (
                      <EmptyBlock
                        icon={Music}
                        title="No recordings yet"
                        description="Add worship recordings with audio or video links to display on your Media page."
                        color="text-rose-400"
                        bg="bg-rose-500/10"
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addWorshipRecording}
                            disabled={!!saving}
                            className="rounded-lg border-dashboard-border text-xs gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add your first recording
                          </Button>
                        }
                      />
                    ) : (
                      <div className="space-y-3">
                        {worshipRecordings.map((rec, idx) => (
                          <ItemCard key={rec.id}>
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                                <Music className="h-4 w-4 text-rose-400" />
                              </div>
                              <div className="min-w-0 flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <StyledInput
                                  value={rec.title}
                                  onChange={(e) => patchWorshipRecording(rec.id, { title: e.target.value })}
                                  placeholder="Song title"
                                  className="font-semibold"
                                />
                                <StyledInput
                                  value={rec.subtitle ?? ""}
                                  onChange={(e) => patchWorshipRecording(rec.id, { subtitle: e.target.value || null })}
                                  placeholder="Feb 9 · Live"
                                />
                                <StyledInput
                                  value={rec.duration_text ?? ""}
                                  onChange={(e) => patchWorshipRecording(rec.id, { duration_text: e.target.value || null })}
                                  placeholder="6:14"
                                />
                                <StyledInput
                                  icon={LinkIcon}
                                  value={rec.url ?? ""}
                                  onChange={(e) => patchWorshipRecording(rec.id, { url: e.target.value || null })}
                                  placeholder="Audio/Video URL"
                                />
                              </div>
                              <DeleteButton onClick={() => deleteWorshipRecording(rec.id)} disabled={!!saving} />
                            </div>
                          </ItemCard>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

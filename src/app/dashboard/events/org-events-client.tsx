"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  X,
  Pencil,
  ExternalLink,
  MapPin,
  Video,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  online_event: boolean;
  eventbrite_event_id: string | null;
  image_url: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  organizations: { name: string; slug: string } | null;
};

type FilterTab = "all" | "upcoming" | "past";

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&q=80",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=900&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=900&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=900&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&q=80",
];

function getDefaultEventImage(index: number): string {
  return DEFAULT_EVENT_IMAGES[index % DEFAULT_EVENT_IMAGES.length];
}

function isUpcoming(startAt: string): boolean {
  return new Date(startAt) >= new Date();
}

// ─── Event Card ──────────────────────────────────────────────────────────────

function EventCard({
  event,
  index,
  onClick,
}: {
  event: EventRow;
  index: number;
  onClick: () => void;
}) {
  const imgSrc = event.image_url?.trim() || getDefaultEventImage(index);
  const start = new Date(event.start_at);
  const upcoming = isUpcoming(event.start_at);
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="goal-card goal-card-enter relative flex flex-col rounded-2xl overflow-hidden text-left w-full cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 border border-[rgba(255,255,255,0.07)]"
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.08) 100%)`,
          }}
        />
        {/* Upcoming / Past badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              upcoming
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-slate-500/20 text-slate-400 border border-slate-500/40"
            }`}
          >
            {upcoming ? "Upcoming" : "Past"}
          </span>
        </div>
        {event.online_event && (
          <div className="absolute top-3 right-3 opacity-90 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/30 backdrop-blur-sm px-2 py-1 text-[10px] font-semibold text-white border border-violet-400/40">
              <Video className="h-3 w-3" />
              Online
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="flex flex-col flex-1 p-4 gap-2"
        style={{ background: "hsl(var(--dashboard-card))" }}
      >
        <h3 className="text-sm font-semibold text-dashboard-text leading-snug line-clamp-2">
          {event.name}
        </h3>
        {event.organizations && (
          <p className="text-xs text-dashboard-text-muted">{event.organizations.name}</p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1 text-xs text-dashboard-text-muted">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{dateStr}</span>
        </div>
        {event.venue_name && !event.online_event && (
          <div className="flex items-center gap-1.5 text-xs text-dashboard-text-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{event.venue_name}</span>
          </div>
        )}
      </div>

      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-emerald-500/50"
        style={{ boxShadow: "inset 0 0 0 1.5px rgba(16,185,129,0.3)" }}
      />
    </button>
  );
}

// ─── Event Detail Panel ─────────────────────────────────────────────────────

function EventDetailPanel({
  event,
  onClose,
}: {
  event: EventRow;
  onClose: () => void;
}) {
  const imgSrc = event.image_url?.trim() || getDefaultEventImage(0);
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  const upcoming = isUpcoming(event.start_at);
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTimeStr = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="goal-panel-enter relative ml-auto flex flex-col w-full max-w-2xl h-full bg-[hsl(var(--dashboard-card))] shadow-2xl overflow-y-auto"
        style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Hero image */}
        <div className="relative h-52 shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt="" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, hsl(var(--dashboard-card)) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%)`,
            }}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Link href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/events/${event.id}/edit`}>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-4 left-4">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                upcoming
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-500/20 text-slate-400 border border-slate-500/40"
              }`}
            >
              {upcoming ? "Upcoming" : "Past"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <div>
            <h2 className="text-xl font-bold text-dashboard-text leading-snug">
              {event.name}
            </h2>
            {event.organizations && (
              <p className="mt-1 text-sm text-dashboard-text-muted">
                {event.organizations.name}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-dashboard-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {timeStr} – {endTimeStr}
              </span>
              {event.online_event && (
                <span className="flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  Online
                </span>
              )}
              {event.venue_name && !event.online_event && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venue_name}
                </span>
              )}
            </div>
          </div>

          {event.description && (
            <div className="rounded-2xl border border-dashboard-border p-4">
              <h3 className="text-sm font-semibold text-dashboard-text mb-2">
                About this event
              </h3>
              <p className="text-sm text-dashboard-text-muted leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {event.venue_address && !event.online_event && (
            <div className="flex items-start gap-2 text-sm text-dashboard-text-muted">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{event.venue_address}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                <ExternalLink className="h-4 w-4" />
                View event page
              </Button>
            </Link>
            <Link href={`/dashboard/events/${event.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({
  filter,
  eventbriteConnected,
  createEventHref,
}: {
  filter: FilterTab;
  eventbriteConnected: boolean;
  createEventHref: string;
}) {
  const label =
    filter === "all"
      ? "No events yet"
      : filter === "upcoming"
        ? "No upcoming events"
        : "No past events";
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4 bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/30">
        <Calendar className="h-7 w-7 text-violet-500 dark:text-violet-400" />
      </div>
      <p className="text-base font-semibold text-dashboard-text mb-1">{label}</p>
      <p className="text-sm text-dashboard-text-muted mb-4 max-w-xs">
        {filter === "all"
          ? "Create an event to get started. Connect Eventbrite to sync ticketing and RSVPs."
          : filter === "upcoming"
            ? "Schedule an event to see it here."
            : "Past events will appear here."}
      </p>
      {eventbriteConnected && filter !== "past" && (
        <Link href={createEventHref}>
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
            <Plus className="h-4 w-4" />
            Create event
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─── Main client ────────────────────────────────────────────────────────────

type Props = {
  initialEvents: EventRow[];
  eventbriteConnected: boolean;
  createEventHref: string;
  connectEventbriteHref: string | null;
};

export function OrgEventsClient({
  initialEvents,
  eventbriteConnected,
  createEventHref,
  connectEventbriteHref,
}: Props) {
  const [events] = useState<EventRow[]>(initialEvents);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [detailEventId, setDetailEventId] = useState<string | null>(null);

  const filteredEvents =
    activeFilter === "all"
      ? events
      : activeFilter === "upcoming"
        ? events.filter((e) => isUpcoming(e.start_at))
        : events.filter((e) => !isUpcoming(e.start_at));

  const upcomingCount = events.filter((e) => isUpcoming(e.start_at)).length;
  const pastCount = events.length - upcomingCount;

  const detailEvent = detailEventId
    ? events.find((e) => e.id === detailEventId) ?? null
    : null;

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All events", count: events.length },
    { id: "upcoming", label: "Upcoming", count: upcomingCount },
    { id: "past", label: "Past", count: pastCount },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 dashboard-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-violet-400" />
            </div>
            <h1 className="text-2xl font-black text-dashboard-text tracking-tight">
              Events
            </h1>
            {events.length > 0 && (
              <span className="rounded-full bg-violet-500/15 text-violet-400 text-xs font-bold px-2.5 py-0.5">
                {events.length}
              </span>
            )}
          </div>
          <p className="text-sm text-dashboard-text-muted">
            Manage your events. Sync with Eventbrite for ticketing and RSVPs.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {eventbriteConnected ? (
            <Link href={createEventHref}>
              <Button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25">
                <Plus className="h-4 w-4" />
                Create event
              </Button>
            </Link>
          ) : (
            connectEventbriteHref && (
              <Link href={connectEventbriteHref}>
                <Button className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white">
                  <Calendar className="h-4 w-4" />
                  Connect Eventbrite
                </Button>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="dashboard-fade-in-delay-1">
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`shrink-0 relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/30"
                    : "text-dashboard-text-muted border border-transparent"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center ${
                      isActive ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-dashboard-text-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 dashboard-fade-in-delay-2">
        {filteredEvents.length === 0 ? (
          <EmptyState
            filter={activeFilter}
            eventbriteConnected={eventbriteConnected}
            createEventHref={createEventHref}
          />
        ) : (
          filteredEvents.map((event, idx) => (
            <EventCard
              key={event.id}
              event={event}
              index={idx}
              onClick={() => setDetailEventId(event.id)}
            />
          ))
        )}
      </div>

      {/* Detail panel */}
      {detailEvent && (
        <EventDetailPanel
          event={detailEvent}
          onClose={() => setDetailEventId(null)}
        />
      )}
    </div>
  );
}

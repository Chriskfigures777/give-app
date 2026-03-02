"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Calendar, MapPin, Video, ArrowUpRight } from "lucide-react";

export type EventResult = {
  id: string;
  name: string;
  slug: string;
  start_at: string;
  venue_name: string | null;
  image_url: string | null;
  online_event: boolean;
  org: { name: string; slug: string } | null;
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80";

export function EventResultCard({ event, index = 0 }: { event: EventResult; index?: number }) {
  const date = new Date(event.start_at);
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const day = date.getDate();
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      <Link
        href={`/events/${event.id}`}
        className="group relative block overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:border-violet-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(139,92,246,0.08)]"
      >
        {/* Image */}
        <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
          <Image
            src={event.image_url || PLACEHOLDER_IMAGE}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Date badge on image */}
          <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl bg-white/90 px-3 py-2 text-center shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              {month}
            </span>
            <span className="text-lg font-bold leading-tight text-slate-900">
              {day}
            </span>
          </div>

          {/* Venue / online badge */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            {event.online_event ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100/90 px-2.5 py-1 text-xs font-semibold text-violet-800 shadow-sm backdrop-blur-sm">
                <Video className="h-3.5 w-3.5" />
                Online
              </span>
            ) : event.venue_name ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {event.venue_name}
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-violet-700">
            {event.name}
          </h3>
          {event.org && (
            <p className="mt-1 text-sm text-slate-500">{event.org.name}</p>
          )}
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {weekday} &middot; {timeStr}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-violet-600 transition-colors group-hover:text-violet-700">
            View event
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

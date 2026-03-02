"use client";

import { motion } from "motion/react";
import { Calendar, MapPin, Globe } from "lucide-react";

type Props = {
  startAt: string;
  endAt: string;
  venueName: string | null;
  venueAddress: string | null;
  onlineEvent: boolean;
  description: string | null;
};

export function EventDetailsSection({
  startAt,
  endAt,
  venueName,
  venueAddress,
  onlineEvent,
  description,
}: Props) {
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  return (
    <section className="relative bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-3xl"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Event details
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            When & where
          </h2>

          <div className="mt-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-emerald-50 p-3">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {startDate.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-slate-600">
                  {startDate.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {" – "}
                  {endDate.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {!onlineEvent && (venueName || venueAddress) && (
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <MapPin className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  {venueName && (
                    <p className="font-medium text-slate-900">{venueName}</p>
                  )}
                  {venueAddress && (
                    <p className="mt-1 text-slate-600">{venueAddress}</p>
                  )}
                </div>
              </div>
            )}

            {onlineEvent && (
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <Globe className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Online event</p>
                  <p className="mt-1 text-slate-600">
                    Join from anywhere. Details will be sent after registration.
                  </p>
                </div>
              </div>
            )}
          </div>

          {description && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-slate-900">About this event</h3>
              <div className="mt-4 prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap">
                {description}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

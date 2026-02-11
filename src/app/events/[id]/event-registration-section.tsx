"use client";

import { motion } from "motion/react";
import { EventbriteWidget } from "./eventbrite-widget";

type Props = {
  eventName: string;
  eventbriteEventId: string | null;
};

export function EventRegistrationSection({
  eventName,
  eventbriteEventId,
}: Props) {
  return (
    <section className="relative bg-slate-50 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px", amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              RSVP
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Register for {eventName}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Secure your spot. Use the form below to register or get tickets.
            </p>
          </div>
          {eventbriteEventId ? (
            <div className="w-full">
              <EventbriteWidget eventId={eventbriteEventId} />
            </div>
          ) : (
            <p className="text-center text-slate-500">
              Registration is not available for this event.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

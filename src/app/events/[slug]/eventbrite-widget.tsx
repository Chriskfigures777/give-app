"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { eventId: string };

declare global {
  interface Window {
    EBWidgets?: {
      createWidget: (opts: {
        widgetType: string;
        eventId: string;
        modal?: boolean;
        modalTriggerElementId?: string;
        onOrderComplete?: () => void;
      }) => void;
    };
  }
}

export function EventbriteWidget({ eventId }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    if (window.EBWidgets) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.eventbrite.com/static/widgets/eb_widgets.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !window.EBWidgets || !eventId) return;

    try {
      window.EBWidgets.createWidget({
        widgetType: "checkout",
        eventId,
        modal: true,
        modalTriggerElementId: "eventbrite-widget-trigger",
        onOrderComplete: () => {
          // Optional: track or redirect
        },
      });
    } catch (err) {
      console.error("Eventbrite widget error:", err);
    }
  }, [loaded, eventId]);

  if (scriptError) {
    return (
      <a
        href={`https://www.eventbrite.com/e/${eventId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
      >
        Register on Eventbrite
      </a>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-600 mb-3">Register or get tickets</p>
      <Button
        id="eventbrite-widget-trigger"
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        Get tickets
      </Button>
    </div>
  );
}

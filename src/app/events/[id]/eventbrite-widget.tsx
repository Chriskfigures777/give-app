"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = { eventId: string };

declare global {
  interface Window {
    EBWidgets?: {
      createWidget: (opts: {
        widgetType: string;
        eventId: string;
        iframeContainerId?: string;
        iframeContainerHeight?: number;
        onOrderComplete?: () => void;
      }) => void;
    };
  }
}

const OFFSET = 140; // nav + spacing

function getWidgetHeight(): number {
  if (typeof window === "undefined") return 600;
  return Math.max(425, window.innerHeight - OFFSET);
}

export function EventbriteWidget({ eventId }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const mounted = useRef(false);
  const containerId = `eventbrite-widget-container-${eventId}`;

  const createWidget = useCallback(() => {
    if (!window.EBWidgets || !eventId) return;

    try {
      window.EBWidgets.createWidget({
        widgetType: "checkout",
        eventId,
        iframeContainerId: containerId,
        iframeContainerHeight: getWidgetHeight(),
        onOrderComplete: () => {
          console.log("Order complete!");
        },
      });
    } catch (err) {
      console.error("Eventbrite widget error:", err);
    }
  }, [eventId, containerId]);

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
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !eventId) return;

    if (document.readyState === "complete") {
      createWidget();
    } else {
      window.addEventListener("load", createWidget);
      return () => window.removeEventListener("load", createWidget);
    }
  }, [loaded, eventId, createWidget]);

  useEffect(() => {
    const setHeight = () => {
      const container = document.getElementById(containerId);
      if (container) {
        container.style.height = `${getWidgetHeight()}px`;
      }
    };

    setHeight(); // Set initial height on mount
    window.addEventListener("resize", setHeight);
    return () => window.removeEventListener("resize", setHeight);
  }, [containerId]);

  if (scriptError) {
    return (
      <a
        href={`https://www.eventbrite.com/e/${eventId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
      >
        Register on Eventbrite
      </a>
    );
  }

  return (
    <div
      id={containerId}
      className="w-full rounded-xl overflow-hidden min-h-[425px]"
      style={{ height: 600 }}
    />
  );
}

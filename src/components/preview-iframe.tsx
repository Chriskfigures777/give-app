"use client";

import { useRef, useEffect, useState } from "react";

/**
 * Iframe that auto-resizes to fit its content (no scrollbar).
 * Listens for postMessage({ type: "resize", height }) from the embed.
 */
export function PreviewIframe({
  src,
  title,
  className,
  minHeight = 420,
}: {
  src: string;
  title: string;
  className?: string;
  minHeight?: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "resize" && typeof e.data.height === "number") {
        setHeight(Math.max(minHeight, e.data.height + 24));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [minHeight]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      className={className}
      style={{ height: `${height}px`, display: "block" }}
    />
  );
}

"use client";

import { useEffect } from "react";

/**
 * Observes the document body height and posts a "resize" message to the
 * parent window so that the embedding iframe can adjust its height.
 * Only sends messages when running inside an iframe.
 */
export function EmbedResizeObserver() {
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;

    let lastHeight = 0;

    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      if (height !== lastHeight && height > 0) {
        lastHeight = height;
        window.parent.postMessage({ type: "resize", height }, "*");
      }
    };

    sendHeight();

    const ro = new ResizeObserver(() => sendHeight());
    ro.observe(document.body);

    const mo = new MutationObserver(() => sendHeight());
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });

    const interval = setInterval(sendHeight, 1000);

    return () => {
      ro.disconnect();
      mo.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}

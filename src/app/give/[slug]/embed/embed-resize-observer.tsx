"use client";

import { useEffect } from "react";

/**
 * Resets the root layout's min-h-screen so the embed page's height is
 * determined by actual content, not forced to 100vh.
 * Also observes the body height and posts a "resize" message to the
 * parent window so that the embedding iframe can adjust its height.
 */
export function EmbedResizeObserver() {
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;

    let lastHeight = 0;

    const sendHeight = () => {
      const main = document.querySelector("main");
      const height = main
        ? main.offsetHeight
        : document.body.scrollHeight;
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

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          html, body, #root-app {
            min-height: auto !important;
            height: auto !important;
          }
        `,
      }}
    />
  );
}

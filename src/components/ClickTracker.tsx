"use client";

import { useEffect } from "react";

export function ClickTracker() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (window.location.pathname.startsWith("/admin")) return;

      const docHeight = document.documentElement.scrollHeight;
      const viewportWidth = document.documentElement.clientWidth;
      const x = e.clientX;
      const y = e.clientY + window.scrollY;

      const payload = JSON.stringify({
        path: window.location.pathname,
        xPct: Math.round((x / viewportWidth) * 10000) / 100,
        yPct: Math.round((y / docHeight) * 10000) / 100,
        docHeight: Math.round(docHeight),
        viewportWidth: Math.round(viewportWidth),
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track-click", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }

    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

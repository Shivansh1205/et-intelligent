"use client";

import { useEffect, useRef, useCallback } from "react";

interface EngagementTrackerProps {
  articleId: string;
}

export default function EngagementTracker({ articleId }: EngagementTrackerProps) {
  const startTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);
  const hasFired = useRef(false);

  const fireEvent = useCallback(async () => {
    if (hasFired.current) return;
    hasFired.current = true;

    const dwellSeconds = Math.floor((Date.now() - startTime.current) / 1000);

    try {
      await fetch("/api/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "engagement",
          article_id: articleId,
          interaction_type: dwellSeconds >= 30 ? "read" : "click",
          dwell_seconds: dwellSeconds,
          scroll_depth: maxScrollDepth.current,
        }),
      });
    } catch (err) {
      console.error("Engagement tracking error:", err);
    }
  }, [articleId]);

  useEffect(() => {
    startTime.current = Date.now();
    hasFired.current = false;

    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const depth = Math.round((scrollTop / docHeight) * 100);
        if (depth > maxScrollDepth.current) {
          maxScrollDepth.current = depth;
        }
      }
    };

    // Fire on beforeunload
    const handleBeforeUnload = () => {
      fireEvent();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Fire on unmount as well
      fireEvent();
    };
  }, [fireEvent]);

  // Invisible — this is a behavior tracker only
  return null;
}

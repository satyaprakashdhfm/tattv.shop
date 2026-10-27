"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Slow continuous auto-scroll for a row whose items are rendered twice: scrollLeft creeps forward a
 * fraction of a pixel per frame and wraps at the halfway point, so the loop is seamless. Pauses while
 * hovered or touched, while `hold` is true, and briefly after an arrow nudge; stands still for
 * reduced motion.
 */
export function useMarquee(track: RefObject<HTMLElement | null>, { speed = 0.5, hold = false } = {}) {
  const paused = useRef(false);
  const holdRef = useRef(hold);
  const pos = useRef(0);

  useEffect(() => {
    holdRef.current = hold;
    const el = track.current;
    if (!el) return;
    if (hold) paused.current = true;
    else {
      pos.current = el.scrollLeft;
      paused.current = false;
    }
  }, [hold, track]);

  useEffect(() => {
    const el = track.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    pos.current = el.scrollLeft;
    const tick = () => {
      if (!paused.current && document.visibilityState === "visible") {
        const half = el.scrollWidth / 2;
        if (half > el.clientWidth / 2) {
          pos.current += speed;
          if (pos.current >= half) pos.current -= half;
          el.scrollLeft = pos.current;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const enter = () => {
      paused.current = true;
    };
    const leave = () => {
      if (holdRef.current) return;
      pos.current = el.scrollLeft;
      paused.current = false;
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("touchstart", enter, { passive: true });
    el.addEventListener("touchend", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("touchstart", enter);
      el.removeEventListener("touchend", leave);
    };
  }, [speed, track]);

  /** Moves the row by about one card, then resumes gliding. */
  return useCallback(
    (dir: 1 | -1) => {
      const el = track.current;
      if (!el) return;
      const card = el.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      paused.current = true;
      el.scrollBy({ left: dir * ((card?.offsetWidth ?? 280) + gap), behavior: "smooth" });
      window.setTimeout(() => {
        pos.current = el.scrollLeft;
        if (!holdRef.current) paused.current = false;
      }, 1200);
    },
    [track],
  );
}

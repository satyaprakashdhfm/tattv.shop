"use client";

import { useEffect, useState } from "react";
import { NAMES } from "./rotating-logo";

const DISPLAY_MS = 2200;

/**
 * The brand name inline in running text, rolling through the same scripts as the header logo
 * (Telugu → Hindi → Kannada → Tamil → Malayalam): the current name slides up and out, the next rises in.
 * All names share one grid cell, so the widest sets the width and the sentence never reflows.
 * Stays on Telugu for reduced-motion users.
 */
export function RotatingName({ className = "" }: { className?: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(timer);
      if (reduce.matches) {
        setActive(0);
        return;
      }
      timer = setInterval(() => {
        if (document.visibilityState === "visible") setActive((i) => (i + 1) % NAMES.length);
      }, DISPLAY_MS);
    };
    start();
    reduce.addEventListener("change", start);
    return () => {
      clearInterval(timer);
      reduce.removeEventListener("change", start);
    };
  }, []);

  const state = (i: number) =>
    i === active ? "translate-y-0 opacity-100" : i === (active + NAMES.length - 1) % NAMES.length ? "-translate-y-[0.6em] opacity-0" : "translate-y-[0.6em] opacity-0";

  return (
    <span className={`inline-grid justify-items-center overflow-hidden px-0.5 align-bottom leading-[1.5] ${className}`}>
      <span className="sr-only">తత్వ్</span>
      {NAMES.map((n, i) => (
        <span
          key={n.lang}
          lang={n.lang}
          aria-hidden
          className={`[grid-area:1/1] whitespace-nowrap transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none ${n.font} ${state(i)}`}
          style={n.size ? { fontSize: `${n.size / 19}em` } : undefined}
        >
          {n.text}
        </span>
      ))}
    </span>
  );
}

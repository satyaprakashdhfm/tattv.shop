"use client";

import { useEffect, useState } from "react";

/**
 * True on phones while an element marked `data-floating-clear` (a full-screen hero, say) covers the
 * bottom of the screen, where the floating WhatsApp button and checkout bar sit. They step aside then,
 * so they never cover that element's own buttons and text, and come back once it has scrolled past.
 */
export function useFloatingClear() {
  const [clear, setClear] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const phone = window.matchMedia("(max-width: 767px)");
    const covering = new Set<Element>();
    // The root is the bottom 140px of the screen: what the floating buttons would sit over.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? covering.add(e.target) : covering.delete(e.target));
        setClear(phone.matches && covering.size > 0);
      },
      { rootMargin: `-${Math.max(0, window.innerHeight - 140)}px 0px 0px 0px` },
    );
    const watch = () => document.querySelectorAll("[data-floating-clear]").forEach((el) => io.observe(el));
    watch();
    // Pages change without a reload; pick up a hero that arrives later.
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    const onMedia = () => setClear(phone.matches && covering.size > 0);
    phone.addEventListener("change", onMedia);
    return () => {
      io.disconnect();
      mo.disconnect();
      phone.removeEventListener("change", onMedia);
    };
  }, []);
  return clear;
}

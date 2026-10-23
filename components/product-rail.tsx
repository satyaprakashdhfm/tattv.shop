"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/products";
import { ProductCard } from "./product-card";

const AUTOPLAY_MS = 3500;

export function ProductRail({ products, cta }: { products: Product[]; cta?: "cart" | "discover" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Move one card at a time; wrap around at either end so the rail loops.
  const step = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const width = (card?.offsetWidth ?? el.clientWidth) + gap;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * width, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") step(1);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, step]);

  const arrow = "absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition hover:bg-ink hover:text-white md:flex";

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <button aria-label="Previous products" onClick={() => step(-1)} className={`${arrow} left-0 -translate-x-1/2`}>
        <ChevronLeft size={20} strokeWidth={1.5} />
      </button>
      <div ref={ref} className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 md:mx-0 md:scroll-px-0 md:px-0">
        {products.map((p) => (
          <div key={p.slug} className="w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-[calc(25%-15px)]">
            <ProductCard product={p} cta={cta} />
          </div>
        ))}
      </div>
      <button aria-label="Next products" onClick={() => step(1)} className={`${arrow} right-0 translate-x-1/2`}>
        <ChevronRight size={20} strokeWidth={1.5} />
      </button>
    </div>
  );
}

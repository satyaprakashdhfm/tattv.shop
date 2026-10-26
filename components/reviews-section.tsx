"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { REVIEWS, SHOW_REVIEWS } from "@/lib/reviews";
import { HeadingRule } from "./section-heading";

/**
 * "What our customers say": one row of rounded quote cards on a warm brown/gold band. The row
 * scrolls sideways with the arrows, a trackpad/shift-wheel, a swipe, or by dragging with the mouse.
 */
export function ReviewsSection() {
  const rowRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);

  /** Scrolls the row by one card in `dir`. */
  const scrollBy = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + gap), behavior: "smooth" });
  };

  if (!SHOW_REVIEWS) return null;

  const arrow =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#f7f1e8] text-[#2b211a] shadow-[0_6px_18px_rgba(0,0,0,0.25)] transition hover:bg-white md:flex";

  return (
    <section className="bg-gradient-to-br from-[#2b211a] via-[#4a3624] to-[#8a6a43] py-14 text-white md:py-20">
      <div className="container-x">
        <div className="mb-8 text-center md:mb-10">
          <p className="eyebrow text-[#e6cfa4]">Customer Love</p>
          <div className="mt-3">
            <HeadingRule title="What Our Customers Say" tone="light" />
          </div>
          <p className="mt-3 text-sm text-white/70">Worn every day, by men across India.</p>
        </div>

        <div className="relative md:px-10">
          <button type="button" aria-label="Previous reviews" onClick={() => scrollBy(-1)} className={`${arrow} left-0`}>
            <ChevronLeft size={20} strokeWidth={1.6} />
          </button>
          <ul
            ref={rowRef}
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse" || !rowRef.current) return;
              drag.current = { x: e.clientX, left: rowRef.current.scrollLeft };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              const row = rowRef.current;
              if (!d || !row) return;
              const dx = e.clientX - d.x;
              row.scrollLeft = d.left - dx;
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => (drag.current = null)}
            className="no-scrollbar -mx-5 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 select-none active:cursor-grabbing md:mx-0 md:scroll-px-0 md:px-0"
          >
            {REVIEWS.map((r) => (
              <li
                key={r.name}
                className="flex w-[72%] shrink-0 snap-start flex-col rounded-2xl bg-[#f7f1e8] p-5 text-[#2b211a] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] sm:w-[45%] md:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]"
              >
                <Quote size={18} strokeWidth={1.4} className="text-gold" />
                <blockquote className="mt-2.5 flex-1 text-sm leading-relaxed text-[#2b211a]/85">{r.quote}</blockquote>
                <div className="mt-4 flex items-center gap-2.5 border-t border-[#e5dacb] pt-3.5">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d8bf94] to-[#a8834a] font-serif text-base text-white"
                  >
                    {r.name.charAt(0)}
                  </span>
                  <p className="leading-tight">
                    <span className="block text-sm font-medium">{r.name}</span>
                    <span className="mt-0.5 block text-xs text-[#2b211a]/60">{r.city}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" aria-label="Next reviews" onClick={() => scrollBy(1)} className={`${arrow} right-0`}>
            <ChevronRight size={20} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </section>
  );
}

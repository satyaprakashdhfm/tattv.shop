"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { REVIEWS, REVIEWS_URL, SHOW_REVIEWS } from "@/lib/reviews";
import { HeadingRule } from "./section-heading";
import { useMarquee } from "./use-marquee";

/**
 * "What our customers say": compact, centred review cards (stars, name, title, two-line quote) on a
 * white band, gliding slowly sideways. Hover pauses it; the arrows nudge it.
 */
export function ReviewsSection() {
  const track = useRef<HTMLUListElement>(null);
  const nudge = useMarquee(track, { speed: 0.5 });

  if (!SHOW_REVIEWS || REVIEWS.length === 0) return null;

  const arrow = "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center border border-line bg-white text-ink transition hover:border-ink md:flex";

  return (
    <section className="border-t border-line bg-white py-14 md:py-20">
      <div className="container-x">
        <div className="mb-8 text-center md:mb-10">
          <p className="eyebrow text-muted">Customer Love</p>
          <div className="mt-3">
            <HeadingRule title="What Our Customers Say" />
          </div>
        </div>

        <div className="relative md:px-14">
          <button type="button" aria-label="Previous reviews" onClick={() => nudge(-1)} className={`${arrow} left-0`}>
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <ul ref={track} className="no-scrollbar flex gap-4 overflow-x-auto">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <li
                key={i}
                aria-hidden={i >= REVIEWS.length || undefined}
                className="flex w-[260px] shrink-0 flex-col items-center gap-2 rounded-3xl border border-line bg-paper px-5 py-6 text-center md:w-[280px]"
              >
                <span role="img" aria-label="5 out of 5 stars" className="text-[13px] tracking-[0.2em] text-ink">
                  ★★★★★
                </span>
                <p className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">{r.name}</span>
                  {r.verified && <span className="rounded-full bg-ink px-2 py-px text-[9px] font-medium uppercase tracking-[0.12em] text-white">Verified</span>}
                </p>
                <h3 className="title text-[13px]">{r.title}</h3>
                <p className="line-clamp-2 text-[13px] leading-relaxed text-ink/70">{r.quote}</p>
                <p className="mt-auto pt-1 text-[11px] uppercase tracking-[0.16em] text-muted">{r.city}</p>
              </li>
            ))}
          </ul>
          <button type="button" aria-label="Next reviews" onClick={() => nudge(1)} className={`${arrow} right-0`}>
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-8 text-center">
          <a href={REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline h-11 px-6">
            Read More Reviews
          </a>
        </div>
      </div>
    </section>
  );
}

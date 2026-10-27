"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { REVIEWS, REVIEWS_URL, SHOW_REVIEWS } from "@/lib/reviews";
import { useMarquee } from "./use-marquee";

/** Gold tones of the section's photo (rings in warm light). */
const GOLD = "#e3bc7a";
const STAR = "#d99a2b";

/**
 * "What our customers say": a dark-and-sand photograph (rings on stone) with the heading on the dark
 * side and cream review cards gliding slowly across the light side. Kept compact. Hover pauses; the arrows nudge.
 */
export function ReviewsSection() {
  const track = useRef<HTMLUListElement>(null);
  const nudge = useMarquee(track, { speed: 0.5 });

  if (!SHOW_REVIEWS || REVIEWS.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden bg-[#1a140f] text-ink md:min-h-[clamp(380px,29vw,470px)]">
      {/* Background photograph: wide on desktop, the dark panel and rings on phones. */}
      <Image src="/images/reviews/reviews-bg.webp" alt="" fill sizes="100vw" className="-z-10 hidden object-cover object-left md:block" />
      <Image src="/images/reviews/reviews-bg-mobile.webp" alt="" fill sizes="100vw" className="-z-10 object-cover object-bottom md:hidden" />
      <div className="absolute inset-x-0 top-0 -z-10 h-2/3 bg-gradient-to-b from-[#120d09]/80 to-transparent md:hidden" />

      <div className="container-x relative grid gap-7 py-10 md:min-h-[inherit] md:grid-cols-[minmax(0,32%)_minmax(0,1fr)] md:items-center md:gap-6 md:py-9">
        <header className="md:self-start md:pt-[2%]">
          <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.36em]" style={{ color: GOLD }}>
            <span className="h-px w-10 bg-current opacity-70 md:w-14" />
            Customer Love
            <span className="h-px w-10 bg-current opacity-70 md:w-14" />
          </p>
          <h2 className="mt-3 font-serif text-[clamp(1.8rem,2.6vw,2.75rem)] font-medium uppercase leading-[1.02] tracking-[0.01em] text-white">
            What our
            <span className="block md:whitespace-nowrap" style={{ color: GOLD }}>
              customers say
            </span>
          </h2>
          <span className="mt-4 block h-[2px] w-16" style={{ backgroundColor: GOLD }} />
        </header>

        <div className="min-w-0 md:pb-4">
          <div className="relative">
            <ul ref={track} className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 py-2 md:mx-0 md:px-0">
              {[...REVIEWS, ...REVIEWS].map((r, i) => (
                <li
                  key={i}
                  aria-hidden={i >= REVIEWS.length || undefined}
                  className="flex min-h-[220px] w-[220px] shrink-0 flex-col items-center rounded-2xl border border-white/70 bg-[#fbf6ee]/95 px-4 pb-5 pt-5 text-center shadow-[0_18px_40px_-22px_rgba(60,35,10,0.55)] backdrop-blur-sm md:w-[230px]"
                >
                  <span role="img" aria-label="5 out of 5 stars" className="text-[14px] leading-none tracking-[0.08em]" style={{ color: STAR }}>
                    ★★★★★
                  </span>
                  <p className="mt-2.5 flex items-center gap-2 text-[13px] font-medium italic">
                    {r.name}
                    {r.verified && <span className="rounded-full bg-ink px-2 py-px text-[9px] font-medium not-italic uppercase tracking-[0.12em] text-white">Verified</span>}
                  </p>
                  <h3 className="mt-2 text-[12px] font-semibold uppercase leading-snug tracking-[0.12em]">{r.title}</h3>
                  <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-ink/70">&ldquo;{r.quote}</p>
                  <span className="mt-auto block h-px w-8 pt-0" style={{ backgroundColor: GOLD }} />
                  <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.28em] text-[#8a6a42]">{r.city}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              aria-label="Next reviews"
              onClick={() => nudge(1)}
              className="absolute -right-2 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full text-ink shadow-[0_10px_24px_-10px_rgba(60,35,10,0.6)] transition-transform hover:scale-105 md:flex lg:-right-5"
              style={{ backgroundColor: GOLD }}
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </div>

          <div className="mt-5 text-center md:mt-6">
            <a
              href={REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-3 rounded-full bg-ink px-8 text-[11px] font-medium uppercase tracking-[0.26em] text-white shadow-[0_12px_26px_-12px_rgba(0,0,0,0.7)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#2b2b2b] md:px-10"
            >
              Read More Reviews <ArrowRight size={16} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>

      {/* Previous arrow sits at the section's left edge, over the photo, as in the design. */}
      <button
        type="button"
        aria-label="Previous reviews"
        onClick={() => nudge(-1)}
        className="absolute left-6 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] transition-transform hover:scale-105 md:flex lg:left-8"
      >
        <ChevronLeft size={18} strokeWidth={1.8} />
      </button>
    </section>
  );
}

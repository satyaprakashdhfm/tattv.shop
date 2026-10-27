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
 * side and cream review cards gliding slowly across the light side. Hover pauses; the arrows nudge.
 */
export function ReviewsSection() {
  const track = useRef<HTMLUListElement>(null);
  const nudge = useMarquee(track, { speed: 0.5 });

  if (!SHOW_REVIEWS || REVIEWS.length === 0) return null;

  return (
    <section className="relative isolate overflow-hidden bg-[#1a140f] text-ink md:min-h-[clamp(560px,43vw,780px)]">
      {/* Background photograph: wide on desktop, the dark panel and rings on phones. */}
      <Image src="/images/reviews/reviews-bg.webp" alt="" fill sizes="100vw" className="-z-10 hidden object-cover object-left md:block" />
      <Image src="/images/reviews/reviews-bg-mobile.webp" alt="" fill sizes="100vw" className="-z-10 object-cover object-bottom md:hidden" />
      <div className="absolute inset-x-0 top-0 -z-10 h-2/3 bg-gradient-to-b from-[#120d09]/80 to-transparent md:hidden" />

      <div className="container-x relative grid gap-10 py-14 md:min-h-[inherit] md:grid-cols-[minmax(0,32%)_minmax(0,1fr)] md:items-center md:gap-6 md:py-16">
        <header className="md:self-start md:pt-[2%]">
          <p className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.42em]" style={{ color: GOLD }}>
            <span className="h-px w-10 bg-current opacity-70 md:w-14" />
            Customer Love
            <span className="h-px w-10 bg-current opacity-70 md:w-14" />
          </p>
          <h2 className="mt-5 font-serif text-[clamp(2.2rem,3.5vw,3.75rem)] font-medium uppercase leading-[1.02] tracking-[0.01em] text-white">
            What our
            <span className="block md:whitespace-nowrap" style={{ color: GOLD }}>
              customers say
            </span>
          </h2>
          <span className="mt-6 block h-[2px] w-24" style={{ backgroundColor: GOLD }} />
        </header>

        <div className="min-w-0 md:pb-4">
          <div className="relative">
            <ul ref={track} className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 py-3 md:mx-0 md:gap-3.5 md:px-0">
              {[...REVIEWS, ...REVIEWS].map((r, i) => (
                <li
                  key={i}
                  aria-hidden={i >= REVIEWS.length || undefined}
                  className="flex min-h-[310px] w-[260px] shrink-0 flex-col items-center rounded-[1.25rem] border border-white/70 bg-[#fbf6ee]/95 px-6 pb-7 pt-8 text-center shadow-[0_18px_40px_-22px_rgba(60,35,10,0.55)] backdrop-blur-sm md:w-[290px]"
                >
                  <span role="img" aria-label="5 out of 5 stars" className="text-[19px] leading-none tracking-[0.08em]" style={{ color: STAR }}>
                    ★★★★★
                  </span>
                  <p className="mt-4 flex items-center gap-2 text-[15px] font-medium italic">
                    {r.name}
                    {r.verified && <span className="rounded-full bg-ink px-2 py-px text-[9px] font-medium not-italic uppercase tracking-[0.12em] text-white">Verified</span>}
                  </p>
                  <h3 className="mt-4 text-[15px] font-semibold uppercase leading-snug tracking-[0.12em]">{r.title}</h3>
                  <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-ink/70">&ldquo;{r.quote}</p>
                  <span className="mt-auto block h-px w-10" style={{ backgroundColor: GOLD }} />
                  <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.3em] text-[#8a6a42]">{r.city}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              aria-label="Next reviews"
              onClick={() => nudge(1)}
              className="absolute -right-2 top-1/2 z-10 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full text-ink shadow-[0_10px_24px_-10px_rgba(60,35,10,0.6)] transition-transform hover:scale-105 md:flex lg:-right-5"
              style={{ backgroundColor: GOLD }}
            >
              <ChevronRight size={22} strokeWidth={1.8} />
            </button>
          </div>

          <div className="mt-8 text-center md:mt-10">
            <a
              href={REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center gap-4 rounded-full px-10 text-[12px] font-medium uppercase tracking-[0.3em] text-ink shadow-[0_14px_30px_-14px_rgba(60,35,10,0.7)] transition-[transform,filter] duration-300 hover:-translate-y-0.5 hover:brightness-105 md:px-16"
              style={{ background: "linear-gradient(180deg, #ebc57f, #d9a957)" }}
            >
              Read More Reviews <ArrowRight size={20} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>

      {/* Previous arrow sits at the section's left edge, over the photo, as in the design. */}
      <button
        type="button"
        aria-label="Previous reviews"
        onClick={() => nudge(-1)}
        className="absolute left-6 top-1/2 z-10 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] transition-transform hover:scale-105 md:flex lg:left-8"
      >
        <ChevronLeft size={22} strokeWidth={1.8} />
      </button>
    </section>
  );
}

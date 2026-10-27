"use client";

import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { REVIEWS, REVIEWS_URL, SHOW_REVIEWS } from "@/lib/reviews";
import { useMarquee } from "./use-marquee";

const GOLD = "#c9a35c";
const STAR = "#b8862b";

/** Thin gold curves drawn at the section's corners. */
function GoldLines() {
  const stroke = { fill: "none", stroke: GOLD, strokeLinecap: "round" as const };
  return (
    <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1440 420" preserveAspectRatio="none" aria-hidden>
      {/* top left */}
      <path d="M0 40 C 90 30, 150 70, 140 140 S 60 230, 0 210" {...stroke} strokeWidth="1" opacity="0.45" />
      <path d="M0 80 C 70 76, 110 110, 100 160" {...stroke} strokeWidth="0.8" opacity="0.35" />
      {/* bottom left sweep */}
      <path d="M0 300 C 160 280, 300 330, 420 420" {...stroke} strokeWidth="1.2" opacity="0.55" />
      <path d="M0 335 C 140 320, 250 360, 330 420" {...stroke} strokeWidth="0.9" opacity="0.4" />
      <path d="M40 420 C 120 370, 230 360, 300 300" {...stroke} strokeWidth="0.8" opacity="0.35" />
      {/* right side */}
      <path d="M1440 60 C 1380 120, 1400 220, 1330 300 S 1250 400, 1300 420" {...stroke} strokeWidth="1.2" opacity="0.5" />
      <path d="M1440 150 C 1400 200, 1420 280, 1370 340 S 1330 410, 1360 420" {...stroke} strokeWidth="0.9" opacity="0.4" />
      <path d="M1440 250 C 1390 300, 1300 330, 1240 420" {...stroke} strokeWidth="0.8" opacity="0.35" />
    </svg>
  );
}

/**
 * "What our customers say": cream band with fine gold curves, centred heading, and white review cards
 * gliding slowly sideways. Hover pauses it; the arrows nudge it.
 */
export function ReviewsSection() {
  const track = useRef<HTMLUListElement>(null);
  const nudge = useMarquee(track, { speed: 0.5 });

  if (!SHOW_REVIEWS || REVIEWS.length === 0) return null;

  const arrow =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5d6bb] bg-white text-ink shadow-[0_6px_16px_-8px_rgba(120,90,40,0.45)] transition hover:border-ink md:flex";

  return (
    <section className="relative isolate overflow-hidden bg-[#fbf7f0] py-7 md:py-8">
      <GoldLines />
      <div className="container-x">
        <header className="text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-[#6b5434]">
            <span className="h-px w-12 md:w-24" style={{ backgroundColor: GOLD }} />
            <span>— Customer Love —</span>
            <span className="h-px w-12 md:w-24" style={{ backgroundColor: GOLD }} />
          </p>
          <h2 className="mt-2 font-serif text-[clamp(1.3rem,2.2vw,2.1rem)] font-bold uppercase tracking-[0.02em]">What Our Customers Say</h2>
        </header>

        <div className="relative mt-4 md:px-14">
          <button type="button" aria-label="Previous reviews" onClick={() => nudge(-1)} className={`${arrow} left-0`}>
            <ChevronLeft size={18} strokeWidth={1.6} />
          </button>
          <ul ref={track} className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 py-2 md:mx-0 md:px-0">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <li
                key={i}
                aria-hidden={i >= REVIEWS.length || undefined}
                className="flex min-h-[185px] w-[230px] shrink-0 flex-col items-center rounded-2xl border border-[#efe4d1] bg-white/90 px-5 pb-4 pt-4 text-center shadow-[0_10px_26px_-18px_rgba(120,90,40,0.5)] md:w-[240px]"
              >
                <span role="img" aria-label="5 out of 5 stars" className="text-[15px] leading-none tracking-[0.06em]" style={{ color: STAR }}>
                  ★★★★★
                </span>
                <p className="mt-2.5 flex items-center gap-2 text-[13px] font-semibold">
                  {r.name}
                  {r.verified && <span className="rounded-full bg-ink px-2 py-px text-[9px] font-medium uppercase tracking-[0.12em] text-white">Verified</span>}
                </p>
                <h3 className="mt-2 text-[13px] font-bold uppercase leading-snug tracking-[0.08em]">{r.title}</h3>
                <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-ink/65">&ldquo;{r.quote}&rdquo;</p>
                <p className="mt-auto pt-2.5 text-[10.5px] font-medium uppercase tracking-[0.24em] text-ink/50">{r.city}</p>
              </li>
            ))}
          </ul>
          <button type="button" aria-label="Next reviews" onClick={() => nudge(1)} className={`${arrow} right-0`}>
            <ChevronRight size={18} strokeWidth={1.6} />
          </button>
        </div>

        <div className="mt-4 text-center">
          <a
            href={REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-3 rounded-full border border-ink bg-white/60 px-8 text-[11px] font-medium uppercase tracking-[0.24em] text-ink transition-colors duration-300 hover:bg-ink hover:text-white md:px-10"
          >
            Read More Reviews <ArrowRight size={16} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </section>
  );
}

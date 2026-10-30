"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { REVIEWS_URL, SAMPLE_REVIEWS, SHOW_SAMPLE_REVIEWS, type Review } from "@/lib/reviews";
import { useMarquee } from "./use-marquee";

const GOLD = "#c9a35c";
const STAR = "#b8862b";

/** Two thin gold curves sweeping along the bottom of the section. */
function GoldLines() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden>
      <path d="M0 120 C 360 40, 1080 40, 1440 120" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.45" vectorEffect="non-scaling-stroke" />
      <path d="M0 165 C 420 95, 1020 95, 1440 165" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A quote clamped to three lines; "Read more" appears only when the text is actually cut off. */
function ReviewQuote({ quote, open, onToggle, copy }: { quote: string; open: boolean; onToggle: () => void; copy: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) setCut(el.scrollHeight > el.clientHeight + 1);
  }, [quote, open]);
  return (
    <>
      <p ref={ref} className={`mt-2 text-[12.5px] leading-relaxed text-ink/65 ${open ? "" : "line-clamp-3"}`}>
        &ldquo;{quote}&rdquo;
      </p>
      {(cut || open) && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          tabIndex={copy ? -1 : undefined}
          className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink underline underline-offset-4 hover:text-ink/70"
        >
          {open ? "Read less" : "Read more"}
        </button>
      )}
    </>
  );
}

/**
 * "What our customers say": cream band with fine gold curves, centred heading, and white review cards
 * gliding slowly sideways. Hover pauses it; the arrows nudge it. Shows the reviews published in
 * Admin → Reviews, or the samples while there are none.
 */
export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const REVIEWS = reviews.length ? reviews : SHOW_SAMPLE_REVIEWS ? SAMPLE_REVIEWS : [];
  const track = useRef<HTMLUListElement>(null);
  const nudge = useMarquee(track, { speed: 0.5 });
  // Reviews opened with "Read more" (by review, so both copies in the loop open together).
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  if (REVIEWS.length === 0) return null;

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
          <ul
            ref={track}
            className="no-scrollbar -mx-5 flex items-start gap-4 overflow-x-auto px-5 py-2 md:mx-0 md:px-0 md:[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
          >
            {[...REVIEWS, ...REVIEWS].map((r, i) => {
              const n = i % REVIEWS.length;
              const isOpen = open.has(n);
              return (
              <li
                key={i}
                aria-hidden={i >= REVIEWS.length || undefined}
                className="flex min-h-[185px] w-[230px] shrink-0 flex-col items-center rounded-2xl border border-[#efe4d1] bg-white/90 px-5 pb-4 pt-4 text-center shadow-[0_10px_26px_-18px_rgba(120,90,40,0.5)] md:w-[240px]"
              >
                <span role="img" aria-label={`${r.rating ?? 5} out of 5 stars`} className="text-[15px] leading-none tracking-[0.06em]" style={{ color: STAR }}>
                  {"★".repeat(r.rating ?? 5)}
                  <span className="text-[#e5d6bb]">{"★".repeat(5 - (r.rating ?? 5))}</span>
                </span>
                <p className="mt-2.5 flex items-center gap-2 text-[13px] font-semibold">
                  {r.name}
                  {r.verified && <span className="rounded-full bg-ink px-2 py-px text-[9px] font-medium uppercase tracking-[0.12em] text-white">Verified</span>}
                </p>
                <h3 className="mt-2 text-[13px] font-bold uppercase leading-snug tracking-[0.08em]">{r.title}</h3>
                {r.quote && <ReviewQuote quote={r.quote} open={isOpen} onToggle={() => toggle(n)} copy={i >= REVIEWS.length} />}
                <p className="mt-auto pt-2.5 text-[10.5px] font-medium uppercase tracking-[0.24em] text-ink/50">{r.city}</p>
              </li>
              );
            })}
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
            className="inline-flex h-10 items-center gap-3 rounded-full bg-ink px-8 text-[11px] font-medium uppercase tracking-[0.24em] text-white transition-opacity duration-300 hover:opacity-85 md:px-10"
          >
            Read More Reviews <ArrowRight size={16} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { CONTACT } from "@/lib/site";
import { REELS, reelPoster, reelVideo } from "@/lib/reels";
import { InstagramIcon } from "./social-icons";
import { HeadingRule } from "./section-heading";
import { useMarquee } from "./use-marquee";

/**
 * "Follow us on Instagram": TATTV's reels playing silently in a row that glides sideways.
 *
 * Lazy on purpose: the clips add up to tens of MB, so a tile only gets its video `src` when it comes
 * near the viewport, plays while on screen and pauses when it leaves. Visitors who never scroll
 * here download only the small posters. One tile at a time can have sound; while it does, the row
 * holds still so the clip being listened to doesn't slide away.
 */
export function InstagramReels() {
  const track = useRef<HTMLUListElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);
  const [audible, setAudible] = useState<number | null>(null);
  const nudge = useMarquee(track, { speed: 0.45, hold: audible !== null });

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    observer.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) {
            if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src;
            v.play().catch(() => {
              // Autoplay refused or not buffered yet: the poster stays up.
            });
          } else {
            v.pause();
          }
        }
      },
      { rootMargin: "200px", threshold: 0.1 },
    );
    videos.current.forEach((v) => v && observer.current?.observe(v));
    return () => observer.current?.disconnect();
  }, []);

  const register = useCallback((el: HTMLVideoElement | null, i: number) => {
    videos.current[i] = el;
    if (el) observer.current?.observe(el);
  }, []);

  // Unmuting one tile mutes every other.
  const toggleSound = (i: number) => {
    const next = audible === i ? null : i;
    videos.current.forEach((v, j) => {
      if (!v) return;
      v.muted = j !== next;
      if (j === next) v.play().catch(() => {});
    });
    setAudible(next);
  };

  if (REELS.length === 0) return null;
  const tiles = [...REELS, ...REELS];
  const arrow = "flex size-10 items-center justify-center border border-line bg-white text-ink transition hover:border-ink";

  return (
    <section className="pb-14 pt-6 md:pb-20 md:pt-8">
      <div className="container-x mb-8 text-center md:mb-10">
        <HeadingRule title="Follow Us on Instagram" />
        <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-muted">New drops, styling ideas and close-ups of every piece, straight from the studio. Tap the speaker for sound.</p>
      </div>

      <ul ref={track} className="no-scrollbar flex gap-3 overflow-x-auto px-5 md:gap-4 md:px-10">
        {tiles.map((r, i) => (
          <li key={i} aria-hidden={i >= REELS.length || undefined} className="relative aspect-[9/16] w-[200px] shrink-0 overflow-hidden rounded-3xl bg-ink md:w-[240px]">
            <video
              ref={(el) => register(el, i)}
              data-src={reelVideo(r.id)}
              poster={reelPoster(r.id)}
              muted
              loop
              playsInline
              preload="none"
              aria-label={r.caption}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3.5 pb-3.5 pt-10 pr-14 text-[12px] font-medium leading-snug text-white">
              {r.caption}
            </div>
            <button
              type="button"
              onClick={() => toggleSound(i)}
              tabIndex={i >= REELS.length ? -1 : undefined}
              aria-label={audible === i ? "Mute video" : "Unmute video"}
              className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
            >
              {audible === i ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-center gap-3 md:mt-10">
        <button type="button" aria-label="Previous reels" onClick={() => nudge(-1)} className={arrow}>
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
        <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-dark h-11 rounded-full px-6">
          <InstagramIcon size={15} strokeWidth={1.5} /> Follow {CONTACT.instagramHandle}
        </a>
        <button type="button" aria-label="More reels" onClick={() => nudge(1)} className={arrow}>
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}

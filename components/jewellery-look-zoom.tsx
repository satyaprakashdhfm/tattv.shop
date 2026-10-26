"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { CATEGORIES, PRODUCTS, type CategoryId } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";

/**
 * One photograph, scrolled like a camera. The look opens wide, then each
 * scroll — one flick of the wheel, one swipe — glides the camera to the
 * next piece: the earring, the pendant, the ring, the bracelet. It stops
 * there while that piece's card pops up beside it with products to swipe
 * through. The fifth pulls back to the whole look with every piece marked,
 * and the sixth carries on down the page.
 *
 * The camera never cuts: it is a single image moved and scaled, so every
 * shot is the same light and the same man. Each stop is a point on the
 * photo (fractions of its width and height) and a zoom, and the frame is
 * clamped so the photo always covers the stage, at any screen shape.
 *
 * Cards list the real catalogue for each category. Needs no ancestor with
 * `overflow: hidden` (that stops sticky from sticking); `overflow: clip` is fine.
 */

const SRC = "/animations/jewellery/look.webp";
export const SRC_SMALL = "/animations/jewellery/look-2400.webp";
/** The photo's width over its height (5504 × 3072, images/model-hero). */
const RATIO = 5504 / 3072;
export const ACCENT = "#d8bf94";

export type Look = {
  id: CategoryId;
  /** Where the piece sits on the photo, as fractions of width and height. */
  fx: number;
  fy: number;
  zoom: number;
  /** Which side of the dot its label sits on in the closing shot. */
  side: "left" | "right";
};

export const LOOKS: Look[] = [
  { id: "earrings", fx: 0.533, fy: 0.208, zoom: 2.6, side: "right" },
  { id: "chains", fx: 0.505, fy: 0.466, zoom: 2.3, side: "left" },
  { id: "rings", fx: 0.567, fy: 0.475, zoom: 2.7, side: "right" },
  { id: "bracelets", fx: 0.622, fy: 0.647, zoom: 2.3, side: "right" },
];

const categoryOf = (look: Look) => CATEGORIES.find((c) => c.id === look.id)!;

/** `focus` 0 frames the whole look; 1 frames a piece beside its card. */
type Shot = { s: number; fx: number; fy: number; focus: number };

const WIDE: Shot = { s: 1, fx: 0.5, fy: 0.5, focus: 0 };
/** The stops: the opening shot, one per piece, then the closing shot. */
const SHOTS: Shot[] = [WIDE, ...LOOKS.map((l) => ({ s: l.zoom, fx: l.fx, fy: l.fy, focus: 1 })), WIDE];
const LAST = SHOTS.length - 1;

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * The camera at a scroll progress: stops sit at even steps, and between two
 * of them it is part way from one shot to the next. The spring on the
 * progress does the easing.
 */
function shotAt(t: number) {
  const k = clamp(t, 0, 1) * LAST;
  const i = Math.min(Math.floor(k), LAST - 1);
  const u = k - i;
  const a = SHOTS[i];
  const b = SHOTS[i + 1];
  return {
    s: lerp(a.s, b.s, u),
    fx: lerp(a.fx, b.fx, u),
    fy: lerp(a.fy, b.fy, u),
    focus: lerp(a.focus, b.focus, u),
  };
}

/** The stop the camera has (nearly) arrived at, or -1 while moving. */
function stopAt(t: number) {
  const k = clamp(t, 0, 1) * LAST;
  const n = Math.round(k);
  return Math.abs(k - n) < 0.12 ? n : -1;
}

/** The photo's place on a stage W × H: offset, scale and drawn size. */
function camera(t: number, W: number, H: number) {
  const c = shotAt(t);
  const wide = W >= 768;
  // Where the piece lands on screen: left of the card on a wide stage,
  // above the card on a narrow one.
  const tx = lerp(0.5, wide ? 0.34 : 0.5, c.focus);
  const ty = lerp(0.5, wide ? 0.5 : 0.34, c.focus);
  const s = c.s;
  const bw = Math.max(W, H * RATIO);
  const bh = bw / RATIO;
  const x = clamp(tx * W - s * c.fx * bw, W - s * bw, 0);
  const y = clamp(ty * H - s * c.fy * bh, H - s * bh, 0);
  return { x, y, s, bw, bh, fx: c.fx, fy: c.fy };
}

export function JewelleryLookZoom() {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 17,
    mass: 1,
  });

  /*
   * One gesture, one stop. While the section is pinned, the page never
   * scrolls freely: a wheel flick, a swipe or an arrow key jumps the page
   * to the next stop and the spring glides the camera there. A trackpad's
   * momentum keeps firing wheel events for a second after the flick, so a
   * gesture only counts once the wheel has gone quiet in between. A gesture
   * made while the camera is still gliding is queued, not dropped. From the
   * top of the page (hero visible under the header) the first flick goes
   * straight to the first piece. Past the last stop the page scrolls on as
   * normal, and back past the first.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let busyUntil = 0;
    let lastWheel = 0;
    let armed = true;
    let touch: { x: number; y: number } | null = null;
    let settle: number | undefined;
    let queued: number | undefined;
    /** Minimum gap between two steps, so one wheel notch never counts twice. */
    const COOLDOWN = 450;

    const bounds = () => ({
      top: el.getBoundingClientRect().top + window.scrollY,
      range: el.offsetHeight - window.innerHeight,
    });
    /**
     * The page's place in the section, in stops; null outside it. -1 means
     * the page is above the section but the hero is already on screen
     * (first load, with the bar and header above it).
     */
    const position = () => {
      const { top, range } = bounds();
      const y = window.scrollY - top;
      if (range <= 0 || y > range + 2) return null;
      if (y < -2) return top - window.scrollY < window.innerHeight * 0.5 ? -1 : null;
      return (y / range) * LAST;
    };
    /** Where a step in `dir` goes; from above the section, down goes straight to the first piece. */
    const target = (k: number, dir: number) => (k < 0 ? (dir > 0 ? 1 : -1) : Math.round(k) + dir);
    const jump = (n: number) => {
      const { top, range } = bounds();
      window.scrollTo({ top: top + (n / LAST) * range, behavior: "instant" });
    };
    /** Takes one step; false when it would leave the section. */
    const step = (dir: number) => {
      const k = position();
      if (k === null) return false;
      const next = target(k, dir);
      if (next < 0 || next > LAST) return false;
      jump(next);
      // Hold longer on the opening and closing shots so they are seen before the page moves on.
      busyUntil = performance.now() + (next === 0 || next === LAST ? 900 : COOLDOWN);
      return true;
    };
    const busy = () => performance.now() < busyUntil;
    /** True when a step in this direction stays inside the section. */
    const canStep = (dir: number) => {
      const k = position();
      if (k === null) return false;
      const next = target(k, dir);
      return next >= 0 && next <= LAST;
    };
    /** Runs a gesture now, or right after the cooldown if one just ran. */
    const request = (dir: number) => {
      if (!canStep(dir)) return false;
      window.clearTimeout(queued);
      if (busy()) queued = window.setTimeout(() => step(dir), busyUntil - performance.now());
      else step(dir);
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      // Sideways swipes belong to the product rows.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.ctrlKey) return;
      const dir = Math.sign(e.deltaY);
      if (!dir || position() === null) return;
      // When the event was created, not handled: if the page stalls mid-flick (decoding the
      // zoomed photo), the queued events keep their real spacing and stay one gesture.
      const now = e.timeStamp;
      // A pause this long means a new flick; shorter ones are the same gesture.
      if (now - lastWheel > 260) armed = true;
      lastWheel = now;
      if (!canStep(dir)) {
        // At the first or last stop. Only a fresh gesture, after the camera has
        // settled, may leave the section; the tail of the gesture that brought
        // us here must not carry the page past the closing (or opening) shot.
        if (!armed || busy()) e.preventDefault();
        return;
      }
      e.preventDefault();
      if (!armed) return;
      armed = false;
      request(dir);
    };

    const onTouchStart = (e: TouchEvent) => {
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      const dx = touch.x - e.touches[0].clientX;
      const dy = touch.y - e.touches[0].clientY;
      if (Math.abs(dx) > Math.abs(dy)) return;
      if (canStep(Math.sign(dy))) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch) return;
      const dx = touch.x - e.changedTouches[0].clientX;
      const dy = touch.y - e.changedTouches[0].clientY;
      touch = null;
      if (Math.abs(dy) < 30 || Math.abs(dx) > Math.abs(dy)) return;
      request(Math.sign(dy));
    };

    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const dir =
        e.key === "ArrowDown" || e.key === "PageDown"
          ? 1
          : e.key === "ArrowUp" || e.key === "PageUp"
            ? -1
            : e.key === " "
              ? e.shiftKey
                ? -1
                : 1
              : 0;
      if (dir && request(dir)) e.preventDefault();
    };

    // A dragged scrollbar can stop anywhere: settle on the nearest stop.
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const k = position();
        if (k !== null && k >= 0 && Math.abs(k - Math.round(k)) > 0.01) {
          jump(clamp(Math.round(k), 0, LAST));
        }
      }, 180);
    };

    const active = { passive: false } as const;
    window.addEventListener("wheel", onWheel, active);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, active);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(queued);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const w = useMotionValue(0);
  const h = useMotionValue(0);
  // How far down the page the section starts (announcement bar + header); the
  // opening text is lifted by this so it sits fully on screen on first load.
  const [lift, setLift] = useState(0);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      w.set(e.contentRect.width);
      h.set(e.contentRect.height);
      const section = ref.current;
      if (section) setLift(Math.max(0, Math.round(section.getBoundingClientRect().top + window.scrollY)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  const [stop, setStop] = useState(0);
  useMotionValueEvent(p, "change", (t) => setStop(stopAt(t)));

  const photoW = useTransform(() => Math.max(w.get(), h.get() * RATIO));
  const photoH = useTransform(() => photoW.get() / RATIO);
  const transform = useTransform(() => {
    const c = camera(p.get(), w.get(), h.get());
    return `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.s})`;
  });
  // The dot on the piece being held, and the line from it to the card.
  const markX = useTransform(() => {
    const c = camera(p.get(), w.get(), h.get());
    return c.x + c.s * c.fx * c.bw;
  });
  const markY = useTransform(() => {
    const c = camera(p.get(), w.get(), h.get());
    return c.y + c.s * c.fy * c.bh;
  });
  const lineW = useTransform(() => Math.max(0, w.get() * 0.54 - markX.get() - 20));

  const introOpacity = useTransform(p, [0, 0.4 / LAST], [1, 0]);
  const phase = stop - 1;
  const look = stop > 0 && stop < LAST ? LOOKS[phase] : null;
  const finale = stop === LAST;

  /** Jumps back to a piece's stop; the camera glides there. */
  function goTo(index: number) {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + ((index + 1) / LAST) * range,
      behavior: "instant",
    });
  }

  return (
    <section ref={ref} className="@container relative h-[600vh] bg-[#16100c]">
      <div ref={stageRef} className="sticky top-0 h-screen overflow-clip text-white">
        <motion.div
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{ width: photoW, height: photoH, transform }}
        >
          <picture>
            <source media="(max-width: 767px)" srcSet={SRC_SMALL} />
            <img
              src={SRC}
              alt="A man in a black linen shirt wearing a silver hoop earring, an onyx pendant, a silver ring and a curb-chain bracelet"
              className="size-full select-none"
              draggable={false}
              decoding="async"
            />
          </picture>
        </motion.div>

        {/* Darkened edges, so the words and cards read over the photo. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,6,4,0.55))]" />

        <motion.div
          className="absolute right-5 left-5 max-w-2xl @3xl:left-[6%]"
          style={{ opacity: introOpacity, bottom: `calc(6vh + ${lift}px)` }}
        >
          {/* Lighter than ACCENT so the small eyebrow reads clearly on the dark photo. */}
          <p className="text-xs font-medium tracking-[0.35em] text-[#f3e3c4] uppercase [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
            The silver edit
          </p>
          <h1 className="mt-3 text-[clamp(2rem,min(7vw,7.5vh),3.75rem)] leading-[1.05] font-light tracking-tight text-balance">
            Worn, not shown off.
          </h1>
          <p className="mt-4 text-sm text-white/60">Scroll to see the look, piece by piece.</p>
        </motion.div>

        <AnimatePresence>
          {look && (
            <motion.div
              key={`mark-${look.id}`}
              className="pointer-events-none absolute top-0 left-0"
              style={{ x: markX, y: markY }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <span className="absolute -top-3 -left-3 size-6 animate-ping rounded-full border opacity-60" style={{ borderColor: ACCENT }} />
              <span className="absolute -top-2 -left-2 size-4 rounded-full border-2 bg-black/30" style={{ borderColor: ACCENT }} />
              <motion.span
                className="absolute top-0 left-5 hidden h-px origin-left @3xl:block"
                style={{ width: lineW, backgroundColor: ACCENT }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {look && (
            <div
              key={look.id}
              className="absolute inset-x-3 bottom-3 @3xl:inset-x-auto @3xl:top-1/2 @3xl:bottom-auto @3xl:left-[54%] @3xl:w-[min(27rem,40%)] @3xl:-translate-y-1/2"
            >
              <LookCard look={look} index={phase} />
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {finale &&
            LOOKS.map((l, i) => <Hotspot key={l.id} look={l} index={i} p={p} w={w} h={h} onSelect={() => goTo(i)} />)}
        </AnimatePresence>

        <AnimatePresence>
          {finale && (
            <motion.div
              className="absolute inset-x-0 bottom-[6%] px-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-light tracking-tight @3xl:text-4xl">Shop the whole look</h2>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {/* Each opens that category's shop page (the labels on the photo still jump back to the piece). */}
                {LOOKS.map((l) => (
                  <Link
                    key={l.id}
                    href={`/shop?category=${l.id}`}
                    className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-[11px] tracking-[0.2em] uppercase backdrop-blur-md transition hover:border-white/60 hover:bg-black/60"
                  >
                    {categoryOf(l).title}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/** The card for the piece in focus: what it is, and its products to swipe. */
function LookCard({ look, index }: { look: Look; index: number }) {
  const category = categoryOf(look);
  const inCategory = PRODUCTS.filter((p) => p.category === look.id);
  const products = inCategory.slice(0, 4);
  const categoryCount = inCategory.length;
  const rowRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const resumeRef = useRef<number | undefined>(undefined);

  /** Moves the row by one box in `dir`, looping round at either end. */
  const advance = (dir: 1 | -1 = 1) => {
    const row = rowRef.current;
    if (!row) return;
    const box = row.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const stepPx = (box?.offsetWidth ?? 120) + gap;
    const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
    const atStart = row.scrollLeft <= 4;
    const left = dir > 0 ? (atEnd ? 0 : row.scrollLeft + stepPx) : atStart ? row.scrollWidth : row.scrollLeft - stepPx;
    row.scrollTo({ left, behavior: "smooth" });
  };

  // Glide the product row one box every 2.5s; stays still for reduced-motion users.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => advance(1), 2500);
    return () => window.clearInterval(t);
  }, [paused]);
  useEffect(() => () => window.clearTimeout(resumeRef.current), []);

  /** Stops the row while the visitor is on it. */
  const hold = () => {
    window.clearTimeout(resumeRef.current);
    setPaused(true);
  };
  /** Carries on 2s after the visitor leaves the row: one step, then the usual rhythm. */
  const release = () => {
    window.clearTimeout(resumeRef.current);
    resumeRef.current = window.setTimeout(() => {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) advance();
      setPaused(false);
    }, 2000);
  };

  return (
    <motion.div
      className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-4 shadow-2xl backdrop-blur-xl @3xl:p-5"
      initial={{ opacity: 0, scale: 0.92, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        scale: 0.96,
        filter: "blur(4px)",
        transition: { duration: 0.2 },
      }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <div className="flex items-center gap-4">
        <Crop look={look} zoom={9} className="size-16 shrink-0 rounded-xl" />
        <div>
          {/* The category name is not shown on the card; kept for screen readers. */}
          <h3 className="sr-only">{category.title}</h3>
          <p className="text-[10px] tracking-[0.3em] text-white/45">
            0{index + 1} / 0{LOOKS.length}
          </p>
          <span className="mt-2 block h-px w-10" style={{ backgroundColor: ACCENT }} />
        </div>
        {/* Manual control for the auto-scrolling row; a click pauses it, and it resumes 2s later. */}
        <div className="ml-auto flex gap-1.5" onMouseEnter={hold} onMouseLeave={release}>
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              aria-label={dir < 0 ? "Previous products" : "Next products"}
              onClick={() => {
                hold();
                advance(dir);
                release();
              }}
              className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 transition hover:border-white/60 hover:text-white"
            >
              {dir < 0 ? <ChevronLeft size={15} strokeWidth={1.6} /> : <ChevronRight size={15} strokeWidth={1.6} />}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-white/60">{category.blurb}</p>

      <div
        ref={rowRef}
        onMouseEnter={hold}
        onMouseLeave={release}
        onTouchStart={hold}
        onTouchEnd={release}
        onFocusCapture={hold}
        onBlurCapture={release}
        className="-mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 @3xl:-mx-5 @3xl:scroll-px-5 @3xl:px-5"
      >
        {products.map((pr, k) => (
          <motion.div
            key={pr.slug}
            className="w-28 shrink-0 snap-start @3xl:w-32"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + k * 0.06, duration: 0.4 }}
          >
            <Link href={`/product/${pr.slug}`} className="group block">
              <span className="relative block aspect-square w-full overflow-hidden rounded-xl bg-white/5">
                <ProductImage product={pr} sizes="128px" className="transition duration-300 group-hover:brightness-110" />
              </span>
              <p className="mt-2 truncate text-xs text-white/85">{pr.name}</p>
              <p className="text-xs" style={{ color: ACCENT }}>
                {formatPrice(pr.price)}
              </p>
            </Link>
          </motion.div>
        ))}
        {/* Closing tile: a faint warm tint with the arrow, label and piece count. */}
        <Link
          href={`/shop?category=${look.id}`}
          className="group relative block aspect-square w-28 shrink-0 snap-start overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-[#d8bf94]/15 via-white/[0.04] to-transparent transition hover:border-white/50 hover:from-[#d8bf94]/25 @3xl:w-32"
        >
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <span
              className="flex size-9 items-center justify-center rounded-full border transition group-hover:translate-x-0.5"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              <ArrowRight size={15} strokeWidth={1.6} />
            </span>
            <span className="text-[11px] tracking-[0.2em] text-white uppercase">View all</span>
            <span className="text-[10px] text-white/60">
              {categoryCount} {categoryCount === 1 ? "piece" : "pieces"}
            </span>
          </span>
        </Link>
      </div>
    </motion.div>
  );
}

/**
 * A square crop of the photo centred on a piece. `zoom` is how many of the
 * crop's widths the whole photo spans.
 */
export function Crop({ look, zoom, className }: { look: Look; zoom: number; className?: string }) {
  const zy = zoom / RATIO;
  const px = clamp((look.fx * zoom - 0.5) / (zoom - 1), 0, 1);
  const py = clamp((look.fy * zy - 0.5) / (zy - 1), 0, 1);
  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(${SRC_SMALL})`,
        backgroundSize: `${zoom * 100}% auto`,
        backgroundPosition: `${px * 100}% ${py * 100}%`,
      }}
    />
  );
}

/** A marked piece in the closing wide shot; clicking it jumps back to it. */
function Hotspot({
  look,
  index,
  p,
  w,
  h,
  onSelect,
}: {
  look: Look;
  index: number;
  p: MotionValue<number>;
  w: MotionValue<number>;
  h: MotionValue<number>;
  onSelect: () => void;
}) {
  const x = useTransform(() => {
    const c = camera(p.get(), w.get(), h.get());
    return c.x + c.s * look.fx * c.bw;
  });
  const y = useTransform(() => {
    const c = camera(p.get(), w.get(), h.get());
    return c.y + c.s * look.fy * c.bh;
  });
  const label = categoryOf(look).title;
  return (
    <motion.div
      className="absolute top-0 left-0"
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300 }}
    >
      {/* A hairline from the piece to its label; no marker sits on the piece itself. */}
      <span
        className={`pointer-events-none absolute top-0 hidden h-px w-7 @3xl:block ${look.side === "right" ? "left-2" : "right-2"}`}
        style={{ backgroundColor: ACCENT }}
      />
      <button
        type="button"
        onClick={onSelect}
        aria-label={label}
        className={`absolute top-0 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] tracking-[0.25em] whitespace-nowrap uppercase backdrop-blur-md transition hover:border-white/60 @3xl:block ${
          look.side === "right" ? "left-9" : "right-9"
        }`}
      >
        {label}
      </button>
    </motion.div>
  );
}

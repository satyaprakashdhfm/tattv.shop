"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
 * next piece: the earring, the pendant, the bracelet, the ring. It stops
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
  { id: "bracelets", fx: 0.622, fy: 0.647, zoom: 2.3, side: "right" },
  { id: "rings", fx: 0.567, fy: 0.475, zoom: 2.7, side: "right" },
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
    stiffness: 45,
    damping: 14,
    mass: 1,
  });

  /*
   * One gesture, one stop. While the section is pinned, the page never
   * scrolls freely: a wheel flick, a swipe or an arrow key jumps the page
   * to the next stop and the spring glides the camera there. A trackpad's
   * momentum keeps firing wheel events for a second after the flick, so a
   * gesture only counts once the wheel has gone quiet in between. Past the
   * last stop the page scrolls on as normal, and back past the first.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let busyUntil = 0;
    let lastWheel = 0;
    let armed = true;
    let touch: { x: number; y: number } | null = null;
    let settle: number | undefined;

    const bounds = () => ({
      top: el.getBoundingClientRect().top + window.scrollY,
      range: el.offsetHeight - window.innerHeight,
    });
    /** The page's place in the section, in stops; null outside it. */
    const position = () => {
      const { top, range } = bounds();
      const y = window.scrollY - top;
      if (range <= 0 || y < -2 || y > range + 2) return null;
      return (y / range) * LAST;
    };
    const jump = (n: number) => {
      const { top, range } = bounds();
      window.scrollTo({ top: top + (n / LAST) * range, behavior: "instant" });
    };
    /** Takes one step; false when it would leave the section. */
    const step = (dir: number) => {
      const k = position();
      if (k === null) return false;
      const next = Math.round(k) + dir;
      if (next < 0 || next > LAST) return false;
      jump(next);
      busyUntil = performance.now() + 650;
      return true;
    };
    const busy = () => performance.now() < busyUntil;

    const onWheel = (e: WheelEvent) => {
      // Sideways swipes belong to the product rows.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.ctrlKey) return;
      if (position() === null) return;
      const now = performance.now();
      if (now - lastWheel > 220) armed = true;
      lastWheel = now;
      if (busy() || !armed) {
        e.preventDefault();
        return;
      }
      if (step(Math.sign(e.deltaY))) {
        e.preventDefault();
        armed = false;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      const dx = touch.x - e.touches[0].clientX;
      const dy = touch.y - e.touches[0].clientY;
      if (Math.abs(dx) > Math.abs(dy)) return;
      const k = position();
      if (k === null) return;
      const next = Math.round(k) + Math.sign(dy);
      if (busy() || (next >= 0 && next <= LAST)) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch) return;
      const dx = touch.x - e.changedTouches[0].clientX;
      const dy = touch.y - e.changedTouches[0].clientY;
      touch = null;
      if (Math.abs(dy) < 30 || Math.abs(dx) > Math.abs(dy) || busy()) return;
      step(Math.sign(dy));
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
      if (!dir || position() === null) return;
      if (busy() || step(dir)) e.preventDefault();
    };

    // A dragged scrollbar can stop anywhere: settle on the nearest stop.
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const k = position();
        if (k !== null && Math.abs(k - Math.round(k)) > 0.01) {
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
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      w.set(e.contentRect.width);
      h.set(e.contentRect.height);
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

        <motion.div className="absolute bottom-[8%] left-5 max-w-md @3xl:left-[6%]" style={{ opacity: introOpacity }}>
          <p className="text-[11px] tracking-[0.35em] uppercase" style={{ color: ACCENT }}>
            The silver edit
          </p>
          <h1 className="mt-3 text-4xl font-light tracking-tight @3xl:text-6xl">Worn, not shown off.</h1>
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
                {LOOKS.map((l, i) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-[11px] tracking-[0.2em] uppercase backdrop-blur-md transition hover:border-white/50"
                  >
                    {categoryOf(l).title}
                  </button>
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
  const products = PRODUCTS.filter((p) => p.category === look.id).slice(0, 4);
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
          <p className="text-[10px] tracking-[0.3em] text-white/45">
            0{index + 1} / 0{LOOKS.length}
          </p>
          <h3 className="mt-1 text-base font-light tracking-[0.25em] uppercase @3xl:text-lg">{category.title}</h3>
          <span className="mt-2 block h-px w-10" style={{ backgroundColor: ACCENT }} />
        </div>
      </div>
      <p className="mt-3 text-sm text-white/60">{category.blurb}</p>

      <div className="-mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 @3xl:-mx-5 @3xl:scroll-px-5 @3xl:px-5">
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
        <Link
          href={`/shop?category=${look.id}`}
          className="grid aspect-square w-28 shrink-0 snap-start place-items-center rounded-xl border border-white/15 text-[11px] tracking-[0.2em] text-white/70 uppercase transition hover:border-white/40 @3xl:w-32"
        >
          View all →
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
      <button type="button" onClick={onSelect} aria-label={label} className="group absolute -top-2.5 -left-2.5 flex items-center">
        <span className="size-5 rounded-full border-2 bg-black/40 transition group-hover:scale-125" style={{ borderColor: ACCENT }} />
        <span
          className={`absolute top-1/2 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] tracking-[0.25em] whitespace-nowrap uppercase backdrop-blur-md @3xl:block ${
            look.side === "right" ? "left-8" : "right-8"
          }`}
        >
          {label}
        </span>
      </button>
    </motion.div>
  );
}

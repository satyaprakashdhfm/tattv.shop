"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Noto_Sans_Telugu, Noto_Serif_Devanagari, Noto_Serif_Kannada, Noto_Serif_Malayalam, Noto_Serif_Tamil } from "next/font/google";

// Script fonts load in the background (no preload) so they never delay the page; the English logo is an image.
// Telugu uses the Sans cut: Noto Serif Telugu draws the final va + virama in a non-standard stacked form.
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: "500", display: "swap", preload: false });
const devanagari = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: "500", display: "swap", preload: false });
const kannada = Noto_Serif_Kannada({ subsets: ["kannada"], weight: "500", display: "swap", preload: false });
const tamil = Noto_Serif_Tamil({ subsets: ["tamil"], weight: "500", display: "swap", preload: false });
const malayalam = Noto_Serif_Malayalam({ subsets: ["malayalam"], weight: "500", display: "swap", preload: false });

/**
 * The brand name in each language, shown after the English logo in this order.
 * `size` (container-width units) and `drop` (em) optically balance scripts that sit high or small:
 * Devanagari hangs from its headline, so it reads smaller and higher than the others at the same size.
 */
const NAMES: { text: string; lang: string; font: string; size?: number; drop?: number }[] = [
  { text: "తత్వ్", lang: "te", font: telugu.className },
  { text: "तत्व्", lang: "hi", font: devanagari.className, size: 22, drop: 0.12 },
  { text: "ತತ್ವ್", lang: "kn", font: kannada.className },
  { text: "தத்வ்", lang: "ta", font: tamil.className },
  { text: "തത്വ്", lang: "ml", font: malayalam.className },
];

const SLIDES = NAMES.length + 1; // English logo + the five scripts
const DISPLAY_MS = 2000;

/**
 * Header logo that cycles English → Telugu → Hindi → Kannada → Tamil → Malayalam.
 * The English image stays in the flow and sets the container size, so the header never shifts;
 * the other names are layered on top. Stays on the English logo for reduced-motion users.
 */
export function RotatingLogo({ widthClass }: { widthClass: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(timer);
      if (reduce.matches) {
        setActive(0);
        return;
      }
      timer = setInterval(() => {
        if (document.visibilityState === "visible") setActive((i) => (i + 1) % SLIDES);
      }, DISPLAY_MS);
    };
    start();
    reduce.addEventListener("change", start);
    return () => {
      clearInterval(timer);
      reduce.removeEventListener("change", start);
    };
  }, []);

  // Outgoing slides drift left, incoming ones arrive from the right.
  const state = (i: number) =>
    i === active ? "translate-x-0 opacity-100" : i === (active + SLIDES - 1) % SLIDES ? "-translate-x-2 opacity-0" : "translate-x-2 opacity-0";
  const motion = "transition-[opacity,translate] duration-[350ms] ease-out motion-reduce:transition-none";

  // Geometry of the English lockup (logo-black.png, 1147×294): the emblem spans the left 21.7% at full
  // height and the wordmark starts at 28.1%. Every language name starts at that same point.
  return (
    // The width lives on this box (inline-size containment ignores content width); names size off it via cqw.
    <span className={`relative block transition-[width] duration-[350ms] ease-out [container-type:inline-size] ${widthClass}`}>
      {/* English wordmark: the full logo image, with its own emblem clipped away (the shared emblem sits on top). */}
      <Image
        src="/brand/logo-black.png"
        alt="TATTV · Energize Your Style Element"
        width={1147}
        height={294}
        priority
        className={`h-auto w-full [clip-path:inset(0_0_0_24%)] ${motion} ${state(0)}`}
      />
      {/* Shared emblem (from Tattv Logo-01): fixed, so it never moves or flickers between names. */}
      <Image src="/brand/emblem-black.png" alt="" width={304} height={356} aria-hidden className="absolute left-0 top-0 h-full w-auto" />
      {NAMES.map((n, i) => (
        <span
          key={n.lang}
          lang={n.lang}
          aria-hidden
          className={`absolute inset-y-0 left-[28.1%] right-0 flex items-center whitespace-nowrap leading-none text-ink ${n.font} ${motion} ${state(i + 1)}`}
          style={{ fontSize: `${n.size ?? 19}cqw`, paddingTop: n.drop ? `${n.drop * 2}em` : undefined }}
        >
          {n.text}
        </span>
      ))}
    </span>
  );
}

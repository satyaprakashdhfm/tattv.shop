"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Noto_Serif_Devanagari, Noto_Serif_Kannada, Noto_Serif_Malayalam, Noto_Serif_Tamil, Noto_Serif_Telugu } from "next/font/google";

// Script fonts load in the background (no preload) so they never delay the page; the English logo is an image.
const telugu = Noto_Serif_Telugu({ subsets: ["telugu"], weight: "500", display: "swap", preload: false });
const devanagari = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: "500", display: "swap", preload: false });
const kannada = Noto_Serif_Kannada({ subsets: ["kannada"], weight: "500", display: "swap", preload: false });
const tamil = Noto_Serif_Tamil({ subsets: ["tamil"], weight: "500", display: "swap", preload: false });
const malayalam = Noto_Serif_Malayalam({ subsets: ["malayalam"], weight: "500", display: "swap", preload: false });

/** The brand name in each language, shown after the English logo in this order. */
const NAMES = [
  { text: "తత్వ్", lang: "te", font: telugu.className },
  { text: "तत्व्", lang: "hi", font: devanagari.className },
  { text: "ತತ್ವ್", lang: "kn", font: kannada.className },
  { text: "தத்வ்", lang: "ta", font: tamil.className },
  { text: "തത്ത്", lang: "ml", font: malayalam.className },
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
  // `width` is included so the logo still shrinks smoothly when the header compacts on scroll.
  const motion = "transition-[opacity,translate,width] duration-[350ms] ease-out motion-reduce:transition-none";

  return (
    <span className="relative block">
      <Image
        src="/brand/logo-black.png"
        alt="TATTV · Energize Your Style Element"
        width={1147}
        height={294}
        priority
        className={`h-auto ${widthClass} ${motion} ${state(0)}`}
      />
      {NAMES.map((n, i) => (
        <span
          key={n.lang}
          lang={n.lang}
          aria-hidden
          className={`absolute inset-0 flex items-center whitespace-nowrap text-[26px] leading-none text-ink md:text-[30px] ${n.font} ${motion} ${state(i + 1)}`}
        >
          {n.text}
        </span>
      ))}
    </span>
  );
}

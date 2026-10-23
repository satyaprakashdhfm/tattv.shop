"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";

const MESSAGES = [
  `Complimentary shipping across India on orders above ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
  "Easy 15-day returns & exchanges",
  "Every order arrives in a signature TATTV pouch",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) => setIndex((i) => (i + dir + MESSAGES.length) % MESSAGES.length);

  return (
    <div className="bg-ink text-white">
      <div className="container-x flex h-9 items-center justify-between gap-4">
        <button aria-label="Previous message" onClick={() => go(-1)} className="opacity-60 hover:opacity-100">
          <ChevronLeft size={14} />
        </button>
        <p key={index} className="animate-fade-in truncate text-center text-[11px] tracking-[0.18em] uppercase">
          {MESSAGES[index]}
        </p>
        <button aria-label="Next message" onClick={() => go(1)} className="opacity-60 hover:opacity-100">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

// Black, gold and sand: the store's own colours.
const COLOURS = ["#0b0b0b", "#c9a35c", "#b8862b", "#e8dcc6", "#6b5434", "#ffffff"];

/**
 * A one-off celebration: pieces burst out from the centre of the parent, fly up and outwards,
 * then fall and fade. Purely decorative; the parent should be `relative`.
 */
export function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 140 + Math.random() * 260;
        return {
          id: i,
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed * 0.75 - 120,
          fall: 260 + Math.random() * 260,
          rotate: Math.random() * 720 - 360,
          delay: Math.random() * 0.15,
          duration: 1.8 + Math.random() * 1.2,
          size: 6 + Math.random() * 6,
          round: Math.random() < 0.3,
          colour: COLOURS[i % COLOURS.length],
        };
      }),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 z-20 size-0">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            backgroundColor: p.colour,
            borderRadius: p.round ? 9999 : 2,
            boxShadow: p.colour === "#ffffff" ? "0 0 0 1px rgb(11 11 11 / 0.08)" : undefined,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: [0, p.x, p.x * 1.15], y: [0, p.y, p.y + p.fall], opacity: [1, 1, 0], rotate: p.rotate, scale: 1 }}
          transition={{ duration: p.duration, delay: p.delay, ease: ["easeOut", "easeIn"], times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}

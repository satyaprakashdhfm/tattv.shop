"use client";

import { useId, type ReactNode } from "react";
import type { Art, BeadStone, ChainStyle, PendantShape, RingStyle, Tone } from "@/lib/products";

/*
 * Procedural SVG renderings of each product. They stand in for product photography:
 * swap <ProductArt> for <Image> once real shots exist.
 */

type View = "front" | "detail";
type Backdrop = "light" | "dark" | "none";

const METAL_STOPS: Record<string, string[]> = {
  silver: ["#ffffff", "#d9d9d9", "#9b9b9b", "#f2f2f2", "#8a8a8a"],
  gold: ["#fff3cc", "#e6c274", "#a77a2b", "#f6dc96", "#8a6224"],
  black: ["#8f8f8f", "#3c3c3c", "#121212", "#505050", "#0d0d0d"],
  steel: ["#f7f9fa", "#bec5ca", "#7b838a", "#e1e5e8", "#6c747b"],
};

const LEATHER: Record<string, { base: string; light: string; dark: string; stitch: string }> = {
  "leather-black": { base: "#1f1d1b", light: "#3a3633", dark: "#0c0b0a", stitch: "#6d655e" },
  "leather-tan": { base: "#a8693a", light: "#c98b57", dark: "#784521", stitch: "#ecd2b2" },
  "leather-brown": { base: "#5a3824", light: "#7a5136", dark: "#3a2215", stitch: "#c9a27f" },
  "leather-navy": { base: "#1f2a44", light: "#33415f", dark: "#121a2c", stitch: "#8e9bb8" },
};

const BEADS: Record<BeadStone, [string, string, string]> = {
  onyx: ["#5a5a5a", "#1a1a1a", "#000000"],
  tiger: ["#f0c27a", "#a8641f", "#4a2a0c"],
  lava: ["#8a8582", "#4b4744", "#222020"],
};

interface Pt {
  x: number;
  y: number;
  a: number; // tangent angle in degrees
}

/** Evenly spaced points (by arc length) along any parametric curve. */
function along(fn: (t: number) => [number, number], spacing: number, closed = false): Pt[] {
  const N = 600;
  const samples: { x: number; y: number; d: number }[] = [];
  let d = 0;
  for (let i = 0; i <= N; i++) {
    const [x, y] = fn(i / N);
    if (i > 0) d += Math.hypot(x - samples[i - 1].x, y - samples[i - 1].y);
    samples.push({ x, y, d });
  }
  const total = d;
  const count = Math.floor(total / spacing);
  const step = closed ? total / count : spacing;
  const pts: Pt[] = [];
  let j = 1;
  for (let k = 0; k < count; k++) {
    const target = k * step;
    while (j < N && samples[j].d < target) j++;
    const a = samples[j - 1];
    const b = samples[j];
    pts.push({ x: a.x, y: a.y, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
  }
  return pts;
}

const cubic = (p0: number[], p1: number[], p2: number[], p3: number[]) => (t: number): [number, number] => {
  const u = 1 - t;
  const f = (i: number) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i];
  return [f(0), f(1)];
};

const ellipse = (cx: number, cy: number, rx: number, ry: number) => (t: number): [number, number] => [
  cx + rx * Math.cos(t * Math.PI * 2 + Math.PI / 2),
  cy + ry * Math.sin(t * Math.PI * 2 + Math.PI / 2),
];

function ChainLinks({ pts, style, m }: { pts: Pt[]; style: ChainStyle; m: string }) {
  return (
    <g>
      {pts.map((p, i) => {
        const t = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.a.toFixed(1)})`;
        switch (style) {
          case "cable":
            return i % 2 === 0 ? (
              <ellipse key={i} transform={t} rx={7.5} ry={4.4} fill="none" stroke={m} strokeWidth={2.2} />
            ) : (
              <rect key={i} transform={t} x={-7.5} y={-1.3} width={15} height={2.6} rx={1.3} fill={m} />
            );
          case "curb":
            return (
              <ellipse
                key={i}
                transform={`${t} rotate(${i % 2 ? 22 : -22})`}
                rx={10}
                ry={6}
                fill="none"
                stroke={m}
                strokeWidth={3.6}
              />
            );
          case "rope":
            return <ellipse key={i} transform={`${t} rotate(48)`} rx={6.2} ry={2.6} fill={m} stroke="rgba(0,0,0,.18)" strokeWidth={0.6} />;
          case "box":
            return i % 2 === 0 ? (
              <rect key={i} transform={t} x={-4.5} y={-4.5} width={9} height={9} rx={1.2} fill="none" stroke={m} strokeWidth={2.2} />
            ) : (
              <rect key={i} transform={t} x={-2} y={-1.4} width={4} height={2.8} fill={m} />
            );
          case "ball":
            return <circle key={i} cx={p.x} cy={p.y} r={2.9} fill={m} />;
        }
      })}
    </g>
  );
}

function Pendant({ shape, m, shade }: { shape: PendantShape; m: string; shade: string }) {
  const engrave = { fill: "none", stroke: shade, strokeWidth: 1.6, opacity: 0.55 } as const;
  const bail = <ellipse cx={200} cy={239} rx={5} ry={9} fill="none" stroke={m} strokeWidth={3} />;
  let body: ReactNode;
  switch (shape) {
    case "tag":
      body = (
        <>
          <rect x={170} y={248} width={60} height={92} rx={12} fill={m} />
          <rect x={177} y={255} width={46} height={78} rx={8} {...engrave} />
          <circle cx={200} cy={259} r={3.5} fill={shade} opacity={0.6} />
          <text x={200} y={300} textAnchor="middle" fontSize={9} letterSpacing={2.5} fill={shade} opacity={0.6} fontFamily="Georgia, serif">
            TATTV
          </text>
        </>
      );
      break;
    case "disc":
      body = (
        <>
          <circle cx={200} cy={292} r={42} fill={m} />
          <circle cx={200} cy={292} r={31} {...engrave} />
          <circle cx={200} cy={292} r={5} fill={shade} opacity={0.65} />
        </>
      );
      break;
    case "triangle":
      body = (
        <>
          <path d="M200 249 L248 334 Q250 338 245 338 L155 338 Q150 338 152 334 Z" fill={m} />
          <path d="M200 268 L234 328 L166 328 Z" {...engrave} />
        </>
      );
      break;
    case "square":
      body = (
        <>
          <rect x={164} y={249} width={72} height={72} rx={4} fill={m} />
          <rect x={174} y={259} width={52} height={52} {...engrave} />
        </>
      );
      break;
    case "drop":
      body = (
        <>
          <path d="M200 249 C214 270 242 298 242 318 A42 42 0 0 1 158 318 C158 298 186 270 200 249 Z" fill={m} />
          <path d="M200 270 C210 286 230 305 230 319 A30 30 0 0 1 170 319 C170 305 190 286 200 270 Z" {...engrave} />
        </>
      );
      break;
    case "hexagon": {
      const hex = (r: number, cy: number) =>
        Array.from({ length: 6 }, (_, k) => {
          const ang = (Math.PI / 3) * k - Math.PI / 2;
          return `${(200 + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`;
        }).join(" ");
      body = (
        <>
          <polygon points={hex(44, 293)} fill={m} />
          <polygon points={hex(32, 293)} {...engrave} />
          <circle cx={200} cy={293} r={12} {...engrave} />
        </>
      );
      break;
    }
    case "arrow":
      body = (
        <>
          <rect x={197} y={250} width={6} height={86} rx={2} fill={m} />
          <path d="M200 352 L186 330 L200 336 L214 330 Z" fill={m} />
          <path d="M197 252 L186 244 L186 256 L197 264 Z M203 252 L214 244 L214 256 L203 264 Z" fill={m} />
        </>
      );
      break;
    case "bar":
      body = <rect x={192} y={248} width={16} height={96} rx={3} fill={m} />;
      break;
    case "monogram":
      body = (
        <>
          <rect x={172} y={249} width={56} height={68} rx={4} fill={m} />
          <rect x={179} y={256} width={42} height={54} fill={shade} opacity={0.82} />
          <path d="M184 262 H209 V269 H200 V306 H192 V269 H184 Z" fill={m} />
          <path d="M205 274 H213 V303 H219 V310 H198 V303 H205 Z" fill={m} />
        </>
      );
      break;
  }
  return (
    <g>
      {bail}
      {body}
    </g>
  );
}

function Ring({ style, m, shade, id }: { style: RingStyle; m: string; shade: string; id: string }) {
  const cx = 200;
  const cy = 222;
  const shadow = <ellipse cx={200} cy={352} rx={92} ry={7} fill="#000" opacity={0.1} />;
  const highlight = (r: number) => (
    <path d={`M${cx - r * 0.7} ${cy - r * 0.7} A${r} ${r} 0 0 1 ${cx + r * 0.1} ${cy - r}`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
  );
  const face = (rx: number, ry: number, inner: ReactNode) => (
    <g>
      <ellipse cx={cx} cy={cy - 100} rx={rx + 4} ry={ry + 8} fill={m} />
      <ellipse cx={cx} cy={cy - 104} rx={rx} ry={ry} fill={m} stroke={shade} strokeOpacity={0.25} strokeWidth={1.5} />
      {inner}
    </g>
  );

  switch (style) {
    case "band":
      return (
        <g>
          {shadow}
          <circle cx={cx} cy={cy} r={104} fill="none" stroke={m} strokeWidth={26} />
          <circle cx={cx} cy={cy} r={91} fill="none" stroke={shade} strokeOpacity={0.3} strokeWidth={1.5} />
          {highlight(110)}
        </g>
      );
    case "ridged":
      return (
        <g>
          {shadow}
          {[93, 104, 115].map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={m} strokeWidth={7.5} />
          ))}
          {[98.5, 109.5].map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={shade} strokeOpacity={0.45} strokeWidth={1.4} />
          ))}
          {highlight(118)}
        </g>
      );
    case "link": {
      const pts = along(ellipse(cx, cy, 104, 104), 21, true);
      return (
        <g>
          {shadow}
          {pts.map((p, i) => (
            <ellipse
              key={i}
              transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.a + (i % 2 ? 18 : -18)).toFixed(1)})`}
              rx={14}
              ry={8.5}
              fill="none"
              stroke={m}
              strokeWidth={5}
            />
          ))}
        </g>
      );
    }
    case "signet":
      return (
        <g>
          {shadow}
          <circle cx={cx} cy={cy} r={100} fill="none" stroke={m} strokeWidth={18} />
          {highlight(106)}
          {face(60, 38, <ellipse cx={cx} cy={cy - 104} rx={46} ry={27} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={2} />)}
          
        </g>
      );
    case "onyx":
      return (
        <g>
          <defs>
            <radialGradient id={`${id}-onyx`} cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#5c5c5c" />
              <stop offset="0.45" stopColor="#141414" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
          </defs>
          {shadow}
          <circle cx={cx} cy={cy} r={100} fill="none" stroke={m} strokeWidth={18} />
          {highlight(106)}
          {face(62, 40, <ellipse cx={cx} cy={cy - 104} rx={50} ry={30} fill={`url(#${id}-onyx)`} />)}
          <ellipse cx={cx - 16} cy={cy - 114} rx={14} ry={5} fill="#fff" opacity={0.25} />
          
        </g>
      );
    case "monogram":
      return (
        <g>
          {shadow}
          <circle cx={cx} cy={cy} r={100} fill="none" stroke={m} strokeWidth={18} />
          {highlight(106)}
          <rect x={cx - 52} y={cy - 150} width={104} height={84} rx={10} fill={m} />
          <rect x={cx - 42} y={cy - 141} width={84} height={66} rx={4} fill={shade} opacity={0.75} />
          <path d={`M${cx - 30} ${cy - 133} H${cx + 14} V${cy - 123} H${cx - 2} V${cy - 82} H${cx - 14} V${cy - 123} H${cx - 30} Z`} fill={m} />
          <path d={`M${cx + 8} ${cy - 116} H${cx + 20} V${cy - 92} H${cx + 32} V${cy - 82} H${cx - 2} V${cy - 92} H${cx + 8} Z`} fill={m} />
          
        </g>
      );
  }
}

function Bracelet({ art, m, shade, id }: { art: Extract<Art, { kind: "bracelet" }>; m: string; shade: string; id: string }) {
  const cx = 200;
  const cy = 200;
  const rx = 145;
  const ry = 92;
  const shadow = <ellipse cx={200} cy={320} rx={150} ry={10} fill="#000" opacity={0.08} />;

  switch (art.style) {
    case "curb":
    case "box": {
      const pts = along(ellipse(cx, cy, rx, ry), art.style === "curb" ? 15 : 11, true);
      return (
        <g>
          {shadow}
          {pts.map((p, i) => {
            const t = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.a.toFixed(1)})`;
            return art.style === "curb" ? (
              <ellipse key={i} transform={`${t} rotate(${i % 2 ? 24 : -24})`} rx={13} ry={8} fill="none" stroke={m} strokeWidth={4.6} />
            ) : (
              <rect key={i} transform={t} x={-5.5} y={-5.5} width={11} height={11} rx={1.5} fill="none" stroke={m} strokeWidth={2.6} />
            );
          })}
          <rect x={cx - 18} y={cy + ry - 9} width={36} height={18} rx={3} fill={m} stroke={shade} strokeOpacity={0.3} />
        </g>
      );
    }
    case "beads": {
      const stone = BEADS[art.bead ?? "onyx"];
      const pts = along(ellipse(cx, cy, rx, ry), 33, true);
      // Draw back beads first so the front of the loop overlaps them.
      const ordered = pts.map((p, i) => ({ ...p, i })).sort((a, b) => a.y - b.y);
      return (
        <g>
          <defs>
            <radialGradient id={`${id}-bead`} cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor={stone[0]} />
              <stop offset="0.5" stopColor={stone[1]} />
              <stop offset="1" stopColor={stone[2]} />
            </radialGradient>
          </defs>
          {shadow}
          {ordered.map((p) =>
            p.i === 0 ? (
              <g key={p.i}>
                <circle cx={p.x} cy={p.y} r={18} fill={m} />
                <circle cx={p.x} cy={p.y} r={11} fill="none" stroke={shade} strokeOpacity={0.4} strokeWidth={1.5} />
              </g>
            ) : (
              <g key={p.i}>
                <circle cx={p.x} cy={p.y} r={17} fill={`url(#${id}-bead)`} />
                {art.bead === "tiger" && (
                  <path d={`M${p.x - 14} ${p.y - 3} Q${p.x} ${p.y + 6} ${p.x + 14} ${p.y - 4}`} stroke="#f7d79b" strokeOpacity={0.45} strokeWidth={2.5} fill="none" />
                )}
                {art.bead === "lava" &&
                  [[-6, -5], [5, 2], [-2, 8], [7, -8], [-9, 4]].map(([dx, dy], k) => (
                    <circle key={k} cx={p.x + dx} cy={p.y + dy} r={1.4} fill="#111" opacity={0.6} />
                  ))}
                <ellipse cx={p.x - 5} cy={p.y - 7} rx={5} ry={3} fill="#fff" opacity={art.bead === "lava" ? 0.08 : 0.28} />
              </g>
            ),
          )}
        </g>
      );
    }
    case "cuff": {
      const P = (deg: number) => {
        const r = (deg * Math.PI) / 180;
        return [cx + rx * Math.sin(r), cy - ry * Math.cos(r)].map((v) => v.toFixed(1)).join(" ");
      };
      const d = `M${P(22)} A${rx} ${ry} 0 1 1 ${P(338)}`;
      return (
        <g>
          {shadow}
          <path d={d} fill="none" stroke={m} strokeWidth={28} strokeLinecap="round" />
          <path d={d} fill="none" stroke={shade} strokeOpacity={0.22} strokeWidth={1.5} transform="translate(0 9)" />
          <path d={d} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={2} transform="translate(0 -8)" />
        </g>
      );
    }
    case "leather": {
      const d = `M${cx} ${cy - ry} A${rx} ${ry} 0 1 1 ${cx - 0.1} ${cy - ry} Z`;
      return (
        <g>
          {shadow}
          <path d={d} fill="none" stroke={m} strokeWidth={18} />
          <path d={d} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={18} strokeDasharray="3 7" />
          <path d={d} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={6} strokeDasharray="6 4" transform="translate(0 -3)" />
          <rect x={cx - 22} y={cy + ry - 12} width={44} height={24} rx={5} fill={`url(#${id}-clasp)`} />
          <line x1={cx} y1={cy + ry - 12} x2={cx} y2={cy + ry + 12} stroke="#000" strokeOpacity={0.3} />
        </g>
      );
    }
  }
}

function Wallet({ style, tone, id }: { style: "bifold" | "cardholder" | "zip"; tone: Tone; id: string }) {
  const L = LEATHER[tone] ?? LEATHER["leather-black"];
  const fill = `url(#${id}-leather)`;
  const stitch = { fill: "none", stroke: L.stitch, strokeOpacity: 0.6, strokeWidth: 1.4, strokeDasharray: "4 3" } as const;
  const emblem = (x: number, y: number) => (
    <g opacity={0.55}>
      <rect x={x - 9} y={y - 11} width={18} height={22} rx={1} fill="none" stroke={L.dark} strokeWidth={2} />
      <path d={`M${x - 5} ${y - 6} H${x + 3} M${x - 1} ${y - 6} V${y + 7} M${x + 2} ${y - 2} V${y + 7} H${x + 5}`} stroke={L.dark} strokeWidth={2} fill="none" />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-leather`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={L.light} />
          <stop offset="0.55" stopColor={L.base} />
          <stop offset="1" stopColor={L.dark} />
        </linearGradient>
      </defs>
      <ellipse cx={200} cy={320} rx={140} ry={10} fill="#000" opacity={0.1} />
      {style === "bifold" && (
        <g transform="rotate(-5 200 210)">
          <rect x={80} y={112} width={240} height={180} rx={14} fill={fill} />
          <rect x={80} y={112} width={14} height={180} rx={7} fill={L.dark} opacity={0.35} />
          <rect x={92} y={124} width={216} height={156} rx={8} {...stitch} />
          {emblem(282, 254)}
        </g>
      )}
      {style === "cardholder" && (
        <g transform="rotate(-4 200 210)">
          <rect x={112} y={118} width={176} height={42} rx={4} fill="#d8d3cb" />
          <rect x={126} y={110} width={150} height={40} rx={4} fill="#b9b2a7" />
          <rect x={100} y={138} width={200} height={146} rx={12} fill={fill} />
          <path d="M100 168 Q200 182 300 168" fill="none" stroke={L.dark} strokeOpacity={0.6} strokeWidth={1.5} />
          <path d="M176 138 A24 20 0 0 0 224 138" fill={L.dark} opacity={0.65} />
          <rect x={110} y={148} width={180} height={126} rx={8} {...stitch} />
          {emblem(200, 236)}
        </g>
      )}
      {style === "zip" && (
        <g transform="rotate(-4 200 210)">
          <rect x={60} y={130} width={280} height={150} rx={16} fill={fill} />
          <rect x={66} y={136} width={268} height={138} rx={12} fill="none" stroke={`url(#${id}-metal)`} strokeWidth={3} strokeDasharray="2 2" />
          <rect x={74} y={144} width={252} height={122} rx={8} {...stitch} />
          <rect x={318} y={126} width={10} height={30} rx={3} fill={`url(#${id}-metal)`} />
          <rect x={314} y={150} width={18} height={10} rx={2} fill={`url(#${id}-metal)`} />
          {emblem(200, 205)}
        </g>
      )}
    </g>
  );
}

export function ProductArt({
  art,
  tone,
  view = "front",
  backdrop = "light",
  className,
  title,
}: {
  art: Art;
  tone: Tone;
  view?: View;
  backdrop?: Backdrop;
  className?: string;
  title?: string;
}) {
  const id = `art${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const metalKey = tone.startsWith("leather") ? "steel" : tone;
  const stops = METAL_STOPS[metalKey];
  const m = `url(#${id}-metal)`;
  const shade = tone === "black" ? "#000" : tone === "gold" ? "#5b3f12" : "#3a3a3a";
  const L = LEATHER[tone];

  let content: ReactNode;
  let detailBox = "100 100 200 200";
  if (art.kind === "chain") {
    const bottom = art.pendant ? 312 : 400;
    const pts = along(cubic([82, -30], [82, bottom], [318, bottom], [318, -30]), art.style === "rope" ? 5 : art.style === "curb" ? 13 : art.style === "ball" ? 7 : 9);
    content = (
      <>
        <ChainLinks pts={pts} style={art.style} m={m} />
        {art.pendant && <Pendant shape={art.pendant} m={m} shade={shade} />}
      </>
    );
    detailBox = art.pendant ? "130 205 140 140" : "110 180 180 180";
  } else if (art.kind === "ring") {
    content = <Ring style={art.style} m={m} shade={shade} id={id} />;
    detailBox = "100 70 200 200";
  } else if (art.kind === "bracelet") {
    content = <Bracelet art={art} m={L ? L.base : m} shade={shade} id={id} />;
    detailBox = "90 180 220 160";
  } else {
    content = <Wallet style={art.style} tone={tone} id={id} />;
    detailBox = "170 170 160 130";
  }

  const bg =
    backdrop === "dark" ? ["#2a2a2a", "#0b0b0b"] : backdrop === "light" ? ["#ffffff", "#ece8e1"] : null;

  return (
    <svg
      viewBox={view === "detail" ? detailBox : "0 0 400 400"}
      className={className}
      role="img"
      aria-label={title ?? "Product illustration"}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          {stops.map((c, i) => (
            <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-clasp`} x1="0" y1="0" x2="0" y2="1">
          {METAL_STOPS.steel.map((c, i) => (
            <stop key={i} offset={i / 4} stopColor={c} />
          ))}
        </linearGradient>
        {bg && (
          <radialGradient id={`${id}-bg`} cx="50%" cy="42%" r="70%">
            <stop offset="0" stopColor={bg[0]} />
            <stop offset="1" stopColor={bg[1]} />
          </radialGradient>
        )}
      </defs>
      {bg && <rect x={-200} y={-200} width={800} height={800} fill={`url(#${id}-bg)`} />}
      {content}
    </svg>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Region, TrendPanel } from "@/lib/trends";

const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

/** Height of the thumbnail as a fraction of the card, keeping the focus region's shape (card-ratio independent). */
const insetHeight = (focus: Region, insetW: number) => (insetW * focus.h) / focus.w;

/** Nearest corners of two boxes, so the connector runs between their edges rather than through them. */
function connector(a: Region, b: Region) {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  const corner = (r: Region, toward: { x: number; y: number }) => ({
    x: toward.x < r.x + r.w / 2 ? r.x : r.x + r.w,
    y: toward.y < r.y + r.h / 2 ? r.y : r.y + r.h,
  });
  return [corner(a, bc), corner(b, ac)];
}

const boxStyle = (r: Region) => ({ left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h) });

/** Background that makes an element show exactly `region` of `src`, whatever the element's size. */
const cropOf = (src: string, region: Region) => ({
  backgroundImage: `url(${src})`,
  backgroundSize: `${pct(1 / region.w)} ${pct(1 / region.h)}`,
  backgroundPosition: `${region.w < 1 ? pct(region.x / (1 - region.w)) : "0%"} ${region.h < 1 ? pct(region.y / (1 - region.h)) : "0%"}`,
});

function Panel({ panel }: { panel: TrendPanel }) {
  const { focus, inset } = panel;
  const insetBox: Region = { x: inset.x, y: inset.y, w: inset.w, h: insetHeight(focus, inset.w) };
  const [p1, p2] = connector(focus, insetBox);

  return (
    <article className="min-w-0 overflow-hidden rounded-xl bg-ink">
      <h3 className="bg-(--tp-tab) px-4 py-3 text-center text-lg font-medium text-(--tp-tab-text) md:text-xl">{panel.title}</h3>
      <div className="relative aspect-[3/4]">
        {/* Photo in black & white; only the two boxes show the piece in colour. */}
        <Image src={panel.image} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover grayscale contrast-[1.08]" />

        {/* inner frame */}
        <div className="pointer-events-none absolute inset-3 border border-white/60" />

        {/* connector line between the item and its thumbnail */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <line x1={p1.x * 100} y1={p1.y * 100} x2={p2.x * 100} y2={p2.y * 100} stroke="white" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* box around the item being worn: the colour photo shown through at 1:1 */}
        <div className="pointer-events-none absolute border border-white" style={{ ...boxStyle(focus), ...cropOf(panel.image, focus) }} />

        {/* thumbnail: the same region in colour, scaled to this box */}
        <div className="pointer-events-none absolute border border-white" style={{ ...boxStyle(insetBox), ...cropOf(panel.image, focus) }}>
          <span className="absolute -top-px left-0 -translate-y-full bg-white px-1.5 py-0.5 text-[9px] font-medium leading-tight text-ink">{panel.label}</span>
        </div>

        <Link
          href={panel.href}
          className="absolute bottom-5 right-5 inline-flex items-center gap-1.5 rounded-full border border-(--tp-btn-border) bg-(--tp-btn) px-5 py-2 text-[15px] font-medium text-(--tp-btn-text) transition hover:bg-(--tp-btn-hover) hover:text-(--tp-btn-hover-text)"
        >
          {panel.cta} <ChevronRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export interface TrendTheme {
  bg: string;
  title: string;
  tab: string;
  tabText: string;
  btn: string;
  btnText: string;
  btnBorder: string;
  btnHover: string;
  btnHoverText: string;
}

export const TREND_THEMES = {
  beige: { bg: "#e8dccb", title: "#0b0b0b", tab: "#7a5a3a", tabText: "#ffffff", btn: "rgba(180,154,127,0.9)", btnText: "#ffffff", btnBorder: "rgba(255,255,255,0.7)", btnHover: "#7a5a3a", btnHoverText: "#ffffff" },
} satisfies Record<string, TrendTheme>;

export function TrendPanels({ title, panels, theme = TREND_THEMES.beige }: { title: string; panels: TrendPanel[]; theme?: TrendTheme }) {
  const vars = {
    "--tp-bg": theme.bg,
    "--tp-title": theme.title,
    "--tp-tab": theme.tab,
    "--tp-tab-text": theme.tabText,
    "--tp-btn": theme.btn,
    "--tp-btn-text": theme.btnText,
    "--tp-btn-border": theme.btnBorder,
    "--tp-btn-hover": theme.btnHover,
    "--tp-btn-hover-text": theme.btnHoverText,
  } as React.CSSProperties;
  return (
    <section className="mt-6 bg-(--tp-bg) py-10 md:mt-8 md:py-14" style={vars}>
      <div className="container-x">
        <h2 className="title mb-7 text-center text-lg text-(--tp-title) md:mb-9 md:text-xl">{title}</h2>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {panels.map((p) => (
            <Panel key={p.title} panel={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Region, TrendPanel } from "@/lib/trends";

const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

/** Height of the close-up as a fraction of the card, keeping the focus region's shape (card-ratio independent). */
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

function Panel({ panel }: { panel: TrendPanel }) {
  const { focus, inset } = panel;
  const insetBox: Region = { x: inset.x, y: inset.y, w: inset.w, h: insetHeight(focus, inset.w) };
  const [p1, p2] = connector(focus, insetBox);

  return (
    <article className="group overflow-hidden rounded-xl bg-ink">
      <h3 className="bg-[#7a5a3a] px-4 py-3 text-center text-lg font-medium text-white md:text-xl">{panel.title}</h3>
      <div className="relative aspect-[3/4]">
        <Image src={panel.image} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />

        {/* inner frame */}
        <div className="pointer-events-none absolute inset-3 border border-white/50" />

        {/* connector line between the item and its close-up */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <line x1={p1.x * 100} y1={p1.y * 100} x2={p2.x * 100} y2={p2.y * 100} stroke="white" strokeOpacity="0.85" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* box around the item being worn */}
        <div
          className="pointer-events-none absolute border border-white/90"
          style={{ left: pct(focus.x), top: pct(focus.y), width: pct(focus.w), height: pct(focus.h) }}
        />

        {/* magnified close-up: the same photo, scaled so the focus region fills this box */}
        <div
          className="absolute border border-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:scale-[1.04]"
          style={{
            left: pct(insetBox.x),
            top: pct(insetBox.y),
            width: pct(insetBox.w),
            height: pct(insetBox.h),
            backgroundImage: `url(${panel.image})`,
            backgroundSize: `${pct(1 / focus.w)} ${pct(1 / focus.h)}`,
            backgroundPosition: `${focus.w < 1 ? pct(focus.x / (1 - focus.w)) : "0%"} ${focus.h < 1 ? pct(focus.y / (1 - focus.h)) : "0%"}`,
          }}
        >
          <span className="absolute -top-[1px] left-0 -translate-y-full bg-white px-1.5 py-0.5 text-[9px] font-medium text-ink">{panel.label}</span>
        </div>

        <Link
          href={panel.href}
          className="absolute bottom-5 right-5 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-[#b49a7f]/90 px-5 py-2 text-[15px] font-medium text-white backdrop-blur-sm transition hover:bg-[#7a5a3a]"
        >
          {panel.cta} <ChevronRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export function TrendPanels({ title, panels }: { title: string; panels: TrendPanel[] }) {
  return (
    <section className="mt-6 bg-[#e8dccb] py-10 md:mt-8 md:py-14">
      <div className="container-x">
        <h2 className="title mb-7 text-center text-lg md:mb-9 md:text-xl">{title}</h2>
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {panels.map((p) => (
            <Panel key={p.title} panel={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

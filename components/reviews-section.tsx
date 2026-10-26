"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { getProduct } from "@/lib/products";
import { REVIEWS, SHOW_REVIEWS } from "@/lib/reviews";
import { ProductImage } from "./product-image";

/**
 * "What our customers say": one row of rounded quote cards on a warm brown/gold band. The row
 * scrolls sideways with the arrows, a trackpad/shift-wheel, a swipe, or by dragging with the mouse.
 */
export function ReviewsSection() {
  const rowRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  /** Scrolls the row by one card in `dir`. */
  const scrollBy = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + gap), behavior: "smooth" });
  };

  if (!SHOW_REVIEWS) return null;

  const arrow =
    "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#f7f1e8] text-[#2b211a] shadow-[0_6px_18px_rgba(0,0,0,0.25)] transition hover:bg-white md:flex";

  return (
    <section className="bg-gradient-to-br from-[#2b211a] via-[#4a3624] to-[#8a6a43] py-14 text-white md:py-20">
      <div className="container-x">
        <div className="mb-8 text-center md:mb-10">
          <p className="eyebrow text-[#e6cfa4]">Customer Love</p>
          <h2 className="title mt-3 text-lg md:text-xl">What Our Customers Say</h2>
          <p className="mt-3 text-sm text-white/70">Worn every day, by men across India.</p>
        </div>

        <div className="relative">
          <button type="button" aria-label="Previous reviews" onClick={() => scrollBy(-1)} className={`${arrow} -left-2 md:-left-5`}>
            <ChevronLeft size={20} strokeWidth={1.6} />
          </button>
          <ul
            ref={rowRef}
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse" || !rowRef.current) return;
              drag.current = { x: e.clientX, left: rowRef.current.scrollLeft, moved: false };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              const row = rowRef.current;
              if (!d || !row) return;
              const dx = e.clientX - d.x;
              if (Math.abs(dx) > 4) d.moved = true;
              row.scrollLeft = d.left - dx;
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => (drag.current = null)}
            // A drag must not also open the product link under the cursor.
            onClickCapture={(e) => {
              if (drag.current?.moved) e.preventDefault();
            }}
            className="no-scrollbar -mx-5 flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 select-none active:cursor-grabbing md:mx-0 md:gap-5 md:scroll-px-0 md:px-0"
          >
            {REVIEWS.map((r) => {
              const product = getProduct(r.product);
              return (
                <li
                  key={r.name}
                  className="flex w-[82%] shrink-0 snap-start flex-col rounded-3xl bg-[#f7f1e8] p-6 text-[#2b211a] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] sm:w-[55%] md:w-[calc((100%-2.5rem)/3)] md:p-7"
                >
                  <Quote size={22} strokeWidth={1.3} className="text-gold" />
                  <blockquote className="mt-4 flex-1 leading-relaxed text-[#2b211a]/85">{r.quote}</blockquote>
                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#e5dacb] pt-4">
                    <p className="text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-[#2b211a]/60"> · {r.city}</span>
                    </p>
                    {product && (
                      <Link
                        href={`/product/${product.slug}`}
                        draggable={false}
                        className="flex min-w-0 items-center gap-2 text-xs text-[#2b211a]/60 hover:text-[#2b211a]"
                      >
                        <span className="truncate">{product.name}</span>
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-[#efe6d8]">
                          <ProductImage product={product} sizes="36px" />
                        </span>
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <button type="button" aria-label="Next reviews" onClick={() => scrollBy(1)} className={`${arrow} -right-2 md:-right-5`}>
            <ChevronRight size={20} strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </section>
  );
}

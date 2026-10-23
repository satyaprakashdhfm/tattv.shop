"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/products";
import { ProductCard } from "./product-card";

export function ProductRail({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 md:-mx-10 md:scroll-px-10 md:px-10">
        {products.map((p) => (
          <div key={p.slug} className="w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-[calc(25%-15px)]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <div className="mt-8 hidden justify-end gap-2 md:flex">
        <button aria-label="Scroll left" onClick={() => scroll(-1)} className="flex h-11 w-11 items-center justify-center border border-line hover:border-ink">
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
        <button aria-label="Scroll right" onClick={() => scroll(1)} className="flex h-11 w-11 items-center justify-center border border-line hover:border-ink">
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

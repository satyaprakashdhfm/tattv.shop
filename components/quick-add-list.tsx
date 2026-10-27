"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";
import { useStore } from "./store-provider";

/** The element that scrolls `el` (the bag drawer's list, or the page). */
function scrollerOf(el: HTMLElement): HTMLElement | Window {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return window;
}

/** One recommended piece: photo, name, price and an Add button (which asks for a size first when the piece has sizes). */
function QuickAddRow({ product, openBag }: { product: Product; openBag: boolean }) {
  const { addToCart, setCartOpen, cart } = useStore();
  const [picking, setPicking] = useState(false);
  const inBag = cart.some((l) => l.slug === product.slug);
  const row = useRef<HTMLLIElement>(null);
  const href = `/product/${product.slug}`;
  const add = (size?: string) => {
    // The new bag line appears above this list; scroll by the same amount so the row stays under the finger.
    const el = row.current;
    const top = el?.getBoundingClientRect().top;
    addToCart({ slug: product.slug, size }, 1, { open: openBag });
    setPicking(false);
    if (el && top != null)
      requestAnimationFrame(() => {
        const shift = el.getBoundingClientRect().top - top;
        if (Math.abs(shift) > 1) scrollerOf(el).scrollBy({ top: shift, behavior: "instant" });
      });
  };
  const pick = () => {
    setPicking(true);
    // Make sure the size buttons that open below are on screen.
    requestAnimationFrame(() => row.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  return (
    <li ref={row} className="py-3 [overflow-anchor:none]">
      <div className="flex items-center gap-3">
        <Link href={href} onClick={() => setCartOpen(false)} className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-sand">
          <ProductImage product={product} sizes="64px" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href} onClick={() => setCartOpen(false)} className="block truncate text-sm font-medium hover:underline">
            {product.name}
          </Link>
          <p className="mt-0.5 text-sm">{formatPrice(product.price)}</p>
        </div>
        {inBag && !picking ? (
          <span className="flex h-9 shrink-0 animate-fade-in items-center gap-1.5 rounded-full bg-sand px-4 text-[10px] font-medium uppercase tracking-[0.18em] text-ink/70">
            <Check size={13} /> Added
          </span>
        ) : picking ? (
          <button type="button" aria-label="Cancel" onClick={() => setPicking(false)} className="flex size-9 shrink-0 items-center justify-center text-muted hover:text-ink">
            <X size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (product.sizes ? pick() : add())}
            aria-label={`Add ${product.name} to bag`}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-ink px-4 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-white"
          >
            <Plus size={13} /> Add
          </button>
        )}
      </div>
      {picking && product.sizes && (
        <div className="mt-2.5 animate-fade-in pl-[76px]">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">Select {product.sizes.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.values.map((s) => (
              <button type="button" key={s} onClick={() => add(s)} className="h-8 min-w-9 rounded-full border border-line bg-white px-3 text-xs transition hover:border-ink hover:bg-ink hover:text-white">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

/** "Complete the look": pieces that go with what's in the bag, each addable in one tap. */
export function QuickAddList({ title = "Complete the Look", count = 3, openBag = false }: { title?: string; count?: number; openBag?: boolean }) {
  const { catalog, cart, cartReady } = useStore();
  // Picked once, when the list first appears, so rows don't reshuffle or jump while the
  // customer adds them; added pieces stay in place marked "Added".
  // A longer list is ranked up front, so a growing `count` (checkout fills its column) adds rows at the end.
  const [slugs, setSlugs] = useState<string[] | null>(null);
  if (cartReady && slugs === null) setSlugs(catalog.recommend(cart.map((l) => l.slug), Math.max(count, 16)).map((p) => p.slug));
  const picks = (slugs ?? []).slice(0, count).map(catalog.getProduct).filter((p): p is Product => !!p);
  if (!picks.length) return null;
  return (
    <section>
      <p className="eyebrow text-muted">{title}</p>
      <ul className="mt-1 divide-y divide-line">
        {picks.map((p) => (
          <QuickAddRow key={p.slug} product={p} openBag={openBag} />
        ))}
      </ul>
    </section>
  );
}

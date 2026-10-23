"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, X } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";
import { useStore } from "./store-provider";

export function ProductCard({ product, cta = "cart" }: { product: Product; cta?: "cart" | "discover" }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [picking, setPicking] = useState(false);
  const saved = wishlist.includes(product.slug);
  const href = `/product/${product.slug}`;
  const hasAlt = product.images.length > 1;

  const add = (size?: string) => {
    addToCart({ slug: product.slug, size });
    setPicking(false);
  };

  return (
    <article
      className={`group flex h-full flex-col bg-white ${cta === "discover" ? "border border-transparent transition-colors duration-300 hover:border-line focus-within:border-line" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden bg-sand">
        <Link href={href} aria-label={product.name} className="absolute inset-0">
          <ProductImage
            product={product}
            className={`transition-all duration-700 group-hover:scale-105 ${hasAlt ? "group-hover:opacity-0" : ""}`}
          />
          {hasAlt && <ProductImage product={product} index={1} className="opacity-0 transition-opacity duration-700 group-hover:opacity-100" />}
        </Link>
        {product.badge && (
          <span className="pointer-events-none absolute left-3 top-3 bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]">
            {product.badge}
          </span>
        )}
        <button
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
          onClick={() => toggleWishlist(product.slug)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur transition hover:bg-white"
        >
          <Heart size={16} strokeWidth={1.5} className={saved ? "fill-ink" : ""} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link href={href} className="text-[15px] font-medium leading-snug hover:underline hover:underline-offset-4">
          {product.name}
        </Link>
        <p className="mt-2 text-[15px] font-semibold">
          {formatPrice(product.price)}
          {product.compareAt && <span className="ml-2 text-sm font-normal text-muted line-through">{formatPrice(product.compareAt)}</span>}
        </p>

        <div className="mt-auto pt-4">
          {cta === "discover" ? (
            // Space is always reserved so the card doesn't jump; the button fades in on hover/focus (always shown on touch screens).
            <Link
              href={href}
              className="btn btn-dark h-11 w-full translate-y-1 px-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
            >
              Discover
            </Link>
          ) : picking && product.sizes ? (
            <div className="animate-fade-in">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em]">Select {product.sizes.label}</p>
                <button aria-label="Cancel" onClick={() => setPicking(false)} className="text-muted hover:text-ink">
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.values.map((s) => (
                  <button key={s} onClick={() => add(s)} className="h-9 min-w-10 border border-line px-2 text-xs transition hover:border-ink hover:bg-ink hover:text-white">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={() => (product.sizes ? setPicking(true) : add())} className="btn btn-dark h-11 w-full px-4">
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

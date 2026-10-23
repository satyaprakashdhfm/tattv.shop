"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { TONES, type Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { ProductArt } from "./product-art";
import { useStore } from "./store-provider";

export function ProductCard({ product }: { product: Product }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [optionIndex, setOptionIndex] = useState(0);
  const option = product.options[optionIndex];
  const saved = wishlist.includes(product.slug);
  const href = `/product/${product.slug}?option=${option.id}`;

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-sand">
        <Link href={href} aria-label={product.name} className="absolute inset-0">
          <ProductArt art={product.art} tone={option.tone} title={product.name} className="absolute inset-0 h-full w-full transition-opacity duration-500 group-hover:opacity-0" />
          <ProductArt
            art={product.art}
            tone={option.tone}
            view="detail"
            title={`${product.name} detail`}
            className="absolute inset-0 h-full w-full scale-105 opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
          />
        </Link>

        {product.badge && (
          <span className="pointer-events-none absolute left-3 top-3 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]">{product.badge}</span>
        )}

        <button
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
          onClick={() => toggleWishlist(product.slug)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur transition hover:bg-white"
        >
          <Heart size={16} strokeWidth={1.5} className={saved ? "fill-ink" : ""} />
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-lg:hidden">
          {product.sizes ? (
            <Link href={href} className="btn btn-light w-full !h-11 hover:!bg-ink hover:!text-white">
              Choose {product.sizes.label}
            </Link>
          ) : (
            <button onClick={() => addToCart({ slug: product.slug, optionId: option.id })} className="btn btn-light w-full !h-11 hover:!bg-ink hover:!text-white">
              Quick Add
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="mb-2 flex items-center gap-1.5">
          {product.options.map((o, i) => (
            <button
              key={o.id}
              aria-label={o.label}
              title={o.label}
              onClick={() => setOptionIndex(i)}
              className={`h-3.5 w-3.5 rounded-full ring-offset-2 transition ${i === optionIndex ? "ring-1 ring-ink" : "ring-1 ring-transparent hover:ring-line"}`}
              style={{ background: TONES[o.tone].swatch }}
            />
          ))}
          <span className="ml-1 text-[11px] text-muted">{option.label}</span>
        </div>
        <Link href={href} className="font-serif text-[19px] leading-snug hover:underline underline-offset-4 decoration-1">
          {product.name}
        </Link>
        <p className="mt-1 text-sm text-muted line-clamp-1">{product.short}</p>
        <p className="mt-2 text-sm">
          {formatPrice(product.price + (option.priceDelta ?? 0))}
          {product.compareAt && <span className="ml-2 text-muted line-through">{formatPrice(product.compareAt + (option.priceDelta ?? 0))}</span>}
        </p>
      </div>
    </article>
  );
}

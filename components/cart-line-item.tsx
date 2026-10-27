"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";
import { useStore, type CartLine } from "./store-provider";

export function CartLineItem({ line, compact }: { line: CartLine; compact?: boolean }) {
  const { updateQty, removeLine, setCartOpen, catalog, limitFor, cart } = useStore();
  const product = catalog.getProduct(line.slug);
  const otherSizes = cart.filter((l) => l.slug === line.slug && l.key !== line.key).reduce((n, l) => n + l.qty, 0);
  const atLimit = line.qty >= limitFor(line.slug) - otherSizes;
  if (!product) return null;
  const href = `/product/${product.slug}`;

  return (
    <div className="flex gap-4 py-5">
      <Link href={href} onClick={() => setCartOpen(false)} className={`relative shrink-0 overflow-hidden rounded-2xl bg-sand ${compact ? "h-24 w-24" : "h-32 w-32"}`}>
        <ProductImage product={product} sizes="128px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <Link href={href} onClick={() => setCartOpen(false)} className="text-[15px] font-medium leading-tight hover:underline">
            {product.name}
          </Link>
          <p className="shrink-0 text-sm font-semibold">{formatPrice(product.price * line.qty)}</p>
        </div>
        <p className="mt-1 text-xs text-muted">
          {product.material}
          {line.size && ` · ${product.sizes?.label} ${line.size}`}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex h-9 items-center overflow-hidden rounded-full border border-line">
            <button type="button" aria-label="Decrease quantity" className="flex h-full w-9 items-center justify-center hover:bg-sand" onClick={() => updateQty(line.key, line.qty - 1)}>
              <Minus size={13} />
            </button>
            <span className="w-8 text-center text-sm">{line.qty}</span>
            <button type="button" aria-label="Increase quantity" disabled={atLimit} className="flex h-full w-9 items-center justify-center hover:bg-sand disabled:opacity-30" onClick={() => updateQty(line.key, line.qty + 1)}>
              <Plus size={13} />
            </button>
          </div>
          <button type="button" onClick={() => removeLine(line.key)} className="text-xs uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

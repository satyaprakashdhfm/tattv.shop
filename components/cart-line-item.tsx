"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { getOption, getProduct, unitPrice } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { ProductArt } from "./product-art";
import { useStore, type CartLine } from "./store-provider";

export function CartLineItem({ line, compact }: { line: CartLine; compact?: boolean }) {
  const { updateQty, removeLine, setCartOpen } = useStore();
  const product = getProduct(line.slug);
  if (!product) return null;
  const option = getOption(product, line.optionId);
  const href = `/product/${product.slug}?option=${option.id}`;

  return (
    <div className="flex gap-4 py-5">
      <Link href={href} onClick={() => setCartOpen(false)} className={`shrink-0 bg-sand ${compact ? "h-24 w-24" : "h-32 w-32"}`}>
        <ProductArt art={product.art} tone={option.tone} className="h-full w-full" title={product.name} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <Link href={href} onClick={() => setCartOpen(false)} className="font-serif text-lg leading-tight hover:underline">
            {product.name}
          </Link>
          <p className="shrink-0 text-sm">{formatPrice(unitPrice(product, option.id) * line.qty)}</p>
        </div>
        <p className="mt-1 text-xs text-muted">
          {option.label}
          {line.size && ` · ${product.sizes?.label} ${line.size}`}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex h-9 items-center border border-line">
            <button aria-label="Decrease quantity" className="flex h-full w-9 items-center justify-center hover:bg-sand" onClick={() => updateQty(line.key, line.qty - 1)}>
              <Minus size={13} />
            </button>
            <span className="w-8 text-center text-sm">{line.qty}</span>
            <button aria-label="Increase quantity" className="flex h-full w-9 items-center justify-center hover:bg-sand" onClick={() => updateQty(line.key, line.qty + 1)}>
              <Plus size={13} />
            </button>
          </div>
          <button onClick={() => removeLine(line.key)} className="text-xs uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

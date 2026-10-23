"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag, X } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { useStore } from "./store-provider";
import { CartLineItem } from "./cart-line-item";

export function CartDrawer() {
  const { cart, cartCount, subtotal, cartOpen, setCartOpen } = useStore();

  useEffect(() => {
    if (!cartOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setCartOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-white">
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <p className="eyebrow">Your Bag ({cartCount})</p>
          <button aria-label="Close bag" onClick={() => setCartOpen(false)}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <ShoppingBag size={36} strokeWidth={1} />
            <p className="title text-base md:text-lg">Your bag is empty</p>
            <p className="text-sm text-muted">Discover pieces made to be worn every day.</p>
            <Link href="/shop" onClick={() => setCartOpen(false)} className="btn btn-dark mt-2">
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-6 py-4">
              <p className="text-xs text-muted">
                {remaining > 0 ? (
                  <>
                    You&apos;re <span className="font-medium text-ink">{formatPrice(remaining)}</span> away from complimentary shipping
                  </>
                ) : (
                  <>You&apos;ve unlocked complimentary shipping</>
                )}
              </p>
              <div className="mt-2 h-0.5 w-full bg-line">
                <div className="h-full bg-ink transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {cart.map((line) => (
                <CartLineItem key={line.key} line={line} compact />
              ))}
            </div>
            <div className="space-y-4 border-t border-line p-6">
              <div className="flex justify-between text-sm">
                <span className="eyebrow">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Taxes included. Shipping calculated at checkout.</p>
              <Link href="/checkout" onClick={() => setCartOpen(false)} className="btn btn-dark w-full">
                Checkout
              </Link>
              <Link href="/cart" onClick={() => setCartOpen(false)} className="btn btn-outline w-full">
                View Bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

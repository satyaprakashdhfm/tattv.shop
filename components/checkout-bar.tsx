"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useStore } from "./store-provider";
import { useFloatingClear } from "./use-floating-clear";

/**
 * Floating "3 items · ₹2,694 · Checkout →" bar, on every storefront page once the bag has
 * something in it. Not on the bag and checkout pages themselves, nor over the open bag drawer.
 */
export function useCheckoutBarShown() {
  const { cartCount, cartReady, cartOpen } = useStore();
  const pathname = usePathname();
  return cartReady && cartCount > 0 && !cartOpen && !["/checkout", "/cart", "/orders"].some((p) => pathname.startsWith(p));
}

export function CheckoutBar() {
  const { cartCount, subtotal } = useStore();
  const shown = useCheckoutBarShown();
  const clear = useFloatingClear();
  if (!shown) return null;

  return (
    <Link
      // A new key on every add replays the fade-in, so each add shows up on the bar.
      key={cartCount}
      href="/checkout"
      aria-label={`Checkout: ${cartCount} ${cartCount === 1 ? "item" : "items"}, ${formatPrice(subtotal)}`}
      className={`fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 animate-fade-in items-center gap-4 whitespace-nowrap rounded-full border border-white/10 bg-ink py-2 pl-2 pr-6 text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] transition-[background-color,transform,opacity] duration-300 hover:-translate-y-0.5 hover:bg-[#1c1c1c] md:bottom-7 ${clear ? "pointer-events-none opacity-0" : ""}`}
      aria-hidden={clear || undefined}
      tabIndex={clear ? -1 : undefined}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-white/10">
        <ShoppingBag size={18} strokeWidth={1.5} />
      </span>
      <span className="text-sm font-medium">
        {cartCount} {cartCount === 1 ? "item" : "items"} · {formatPrice(subtotal)}
      </span>
      <span className="h-4 w-px bg-white/25" />
      <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em]">
        Checkout <ArrowRight size={14} />
      </span>
    </Link>
  );
}

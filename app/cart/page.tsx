"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { CartLineItem } from "@/components/cart-line-item";
import { ProductCard } from "@/components/product-card";
import { PRODUCTS } from "@/lib/products";
import { formatPrice, shippingFor } from "@/lib/format";

export default function CartPage() {
  const { cart, cartCount, subtotal } = useStore();
  const shipping = shippingFor(subtotal);
  const suggestions = PRODUCTS.filter((p) => p.bestseller && !cart.some((l) => l.slug === p.slug)).slice(0, 4);

  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="display text-5xl">Your Bag</h1>
      <p className="mt-2 text-sm text-muted">
        {cartCount} {cartCount === 1 ? "item" : "items"}
      </p>

      {cart.length === 0 ? (
        <div className="py-20 text-center">
          <p className="display text-3xl">Your bag is empty</p>
          <Link href="/shop" className="btn btn-dark mt-8">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="divide-y divide-line border-y border-line lg:col-span-8">
            {cart.map((line) => (
              <CartLineItem key={line.key} line={line} />
            ))}
          </div>
          <aside className="lg:col-span-4">
            <div className="bg-sand p-8 lg:sticky lg:top-36">
              <p className="eyebrow mb-6">Order Summary</p>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{shipping ? formatPrice(shipping) : "Complimentary"}</dd>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-4 text-base font-medium">
                  <dt>Total</dt>
                  <dd>{formatPrice(subtotal + shipping)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted">Inclusive of all taxes</p>
              <Link href="/checkout" className="btn btn-dark mt-8 w-full">
                <Lock size={14} /> Secure Checkout
              </Link>
              <Link href="/shop" className="mt-4 block text-center text-xs uppercase tracking-[0.16em] underline underline-offset-4">
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      )}

      {suggestions.length > 0 && (
        <section className="mt-24">
          <h2 className="display mb-10 text-4xl">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

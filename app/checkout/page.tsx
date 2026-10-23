"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { ProductArt } from "@/components/product-art";
import { getOption, getProduct, unitPrice } from "@/lib/products";
import { formatPrice, shippingFor } from "@/lib/format";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", note: "GPay, PhonePe, Paytm & more" },
  { id: "card", label: "Credit / Debit Card", note: "Visa, Mastercard, RuPay, Amex" },
  { id: "netbanking", label: "Net Banking", note: "All major Indian banks" },
  { id: "cod", label: "Cash on Delivery", note: "Available on orders under ₹10,000" },
];

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useStore();
  const [payment, setPayment] = useState("upi");
  const [gift, setGift] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const shipping = shippingFor(subtotal);

  if (orderId) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white">
          <Check size={26} />
        </span>
        <h1 className="display mt-8 text-5xl">Thank you</h1>
        <p className="mt-4 max-w-md text-muted">
          Your order <span className="font-medium text-ink">{orderId}</span> has been placed. A confirmation will be sent to your email shortly.
        </p>
        <Link href="/shop" className="btn btn-dark mt-10">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="display text-5xl">Your bag is empty</h1>
        <Link href="/shop" className="btn btn-dark mt-10">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="display text-5xl">Checkout</h1>
      <form
        className="mt-10 grid gap-12 lg:grid-cols-12"
        onSubmit={(e) => {
          e.preventDefault();
          setOrderId(`TTV-${Math.floor(100000 + Math.random() * 900000)}`);
          clearCart();
          window.scrollTo({ top: 0 });
        }}
      >
        <div className="space-y-12 lg:col-span-7">
          <fieldset>
            <legend className="eyebrow mb-5">1. Contact</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <input required type="email" placeholder="Email" aria-label="Email" className="field sm:col-span-2" />
              <input required type="tel" placeholder="Mobile number" aria-label="Mobile number" pattern="[0-9]{10}" title="10-digit mobile number" className="field sm:col-span-2" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-5">2. Shipping Address</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="First name" aria-label="First name" className="field" />
              <input required placeholder="Last name" aria-label="Last name" className="field" />
              <input required placeholder="Address" aria-label="Address" className="field sm:col-span-2" />
              <input placeholder="Apartment, suite, landmark (optional)" aria-label="Apartment" className="field sm:col-span-2" />
              <input required placeholder="City" aria-label="City" className="field" />
              <input required placeholder="State" aria-label="State" className="field" />
              <input required placeholder="Pincode" aria-label="Pincode" pattern="[0-9]{6}" title="6-digit pincode" className="field" />
              <input disabled value="India" aria-label="Country" className="field bg-sand text-muted" />
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm">
              <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="h-4 w-4 accent-ink" />
              This is a gift. Add a complimentary handwritten note.
            </label>
            {gift && <textarea placeholder="Your message" aria-label="Gift message" maxLength={200} className="field mt-3 h-24 py-3" />}
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-5">3. Payment</legend>
            <div className="divide-y divide-line border border-line">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-4 p-4 text-sm">
                  <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} className="h-4 w-4 accent-ink" />
                  <span className="flex-1">
                    <span className="block font-medium">{m.label}</span>
                    <span className="text-xs text-muted">{m.note}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Lock size={12} /> Demo storefront: no payment will be taken.
            </p>
          </fieldset>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-sand p-8 lg:sticky lg:top-28">
            <p className="eyebrow mb-6">Order Summary</p>
            <ul className="space-y-4">
              {cart.map((line) => {
                const product = getProduct(line.slug)!;
                const option = getOption(product, line.optionId);
                return (
                  <li key={line.key} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 bg-white">
                      <ProductArt art={product.art} tone={option.tone} className="h-full w-full" />
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">{line.qty}</span>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-serif text-base">{product.name}</p>
                      <p className="text-xs text-muted">
                        {option.label}
                        {line.size && ` · ${line.size}`}
                      </p>
                    </div>
                    <p className="text-sm">{formatPrice(unitPrice(product, option.id) * line.qty)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-6 space-y-3 border-t border-ink/10 pt-6 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{shipping ? formatPrice(shipping) : "Complimentary"}</dd>
              </div>
              {gift && (
                <div className="flex justify-between">
                  <dt>Gift box & note</dt>
                  <dd>Complimentary</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-ink/10 pt-4 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal + shipping)}</dd>
              </div>
            </dl>
            <button type="submit" className="btn btn-dark mt-8 w-full">
              <Lock size={14} /> Place Order
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}

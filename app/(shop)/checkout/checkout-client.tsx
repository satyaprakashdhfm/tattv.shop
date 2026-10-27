"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Gift, Lock, Plus, Tag, TicketPercent, Truck, X } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { CartLineItem } from "@/components/cart-line-item";
import { QuickAddList } from "@/components/quick-add-list";
import { DemoPayment } from "@/components/demo-payment";
import { COUPONS, GIFT_WRAP, couponBlocker } from "@/lib/site";
import { CUSTOMER_RULES, type CustomerInput } from "@/lib/pricing";
import { FREE_SHIPPING_THRESHOLD, formatPrice, shippingFor } from "@/lib/format";
import { api, rememberOrder } from "@/lib/client-api";

const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const EMPTY: CustomerInput = { email: "", phone: "", firstName: "", lastName: "", address: "", apartment: "", city: "", state: "", pin: "" };
const DRAFT_KEY = "tattv.checkout.draft";
type RuleKey = keyof typeof CUSTOMER_RULES;

interface PlacedOrder {
  order: { id: string; total: number; customer: CustomerInput };
  token: string;
  payment: { mode: "cod" | "demo" | "razorpay"; keyId?: string; razorpayOrderId?: string };
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
  }
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection and try again."));
    document.body.appendChild(s);
  });
}

function Field({
  name,
  label,
  form,
  errors,
  touched,
  onChange,
  onBlur,
  className = "",
  ...rest
}: {
  name: keyof CustomerInput;
  label: string;
  form: CustomerInput;
  errors: Partial<Record<RuleKey, string>>;
  touched: Partial<Record<string, boolean>>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "form" | "name">) {
  const err = touched[name] && errors[name as RuleKey];
  return (
    <div className={className}>
      <label htmlFor={`co-${name}`} className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/70">
        {label}
      </label>
      <input
        id={`co-${name}`}
        name={name}
        value={form[name]}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={!!err}
        aria-describedby={err ? `co-${name}-err` : undefined}
        className={`field ${err ? "!border-red-700" : ""}`}
        {...rest}
      />
      {err && (
        <p id={`co-${name}-err`} className="mt-1 text-xs text-red-700">
          {err}
        </p>
      )}
    </div>
  );
}

const Panel = ({ title, step, icon, className = "", children }: { title: string; step?: number; icon?: React.ReactNode; className?: string; children: React.ReactNode }) => (
  <section className={`rounded-3xl border border-line bg-white p-5 md:p-6 ${className}`}>
    <h2 className="eyebrow mb-5 flex items-center gap-3">
      {step && <span className="flex size-6 items-center justify-center rounded-full bg-ink text-[10px] tracking-normal text-white">{step}</span>}
      {icon && <span className="flex size-6 items-center justify-center rounded-full bg-sand">{icon}</span>}
      {title}
    </h2>
    {children}
  </section>
);

/**
 * Checkout on one screen. Left: the bag (editable), "Complete the Look" quick-adds and gift packing.
 * Right: contact, address, payment, offers and the totals. Both columns stretch to the same
 * height, and the pay button floats centred at the bottom of the screen. Prices are shown here for
 * convenience; the server re-prices the order when it is placed.
 */
export function CheckoutClient({ online, cod }: { online: "razorpay" | "demo" | null; cod: boolean }) {
  const router = useRouter();
  const { cart, cartCount, subtotal, cartReady, clearCart, catalog } = useStore();
  const [form, setForm] = useState<CustomerInput>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [codeMsg, setCodeMsg] = useState("");
  const [gift, setGift] = useState(false);
  const [giftOccasion, setGiftOccasion] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [payMethod, setPayMethod] = useState<"online" | "cod">(online ? "online" : "cod");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState<PlacedOrder | null>(null);
  // An online order waiting for payment, reused if the customer retries without changing anything.
  const [pending, setPending] = useState<PlacedOrder | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const suggestBoxRef = useRef<HTMLDivElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const [suggestCount, setSuggestCount] = useState(4);

  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
      if (d) setForm((f) => ({ ...f, ...d }));
    } catch {
      // No saved draft.
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Storage unavailable: the form still works.
    }
  }, [form]);
  useEffect(() => setPending(null), [cart, applied, payMethod, gift, giftOccasion, giftMessage]);

  // fitSuggestions: on desktop, add or remove suggestion rows until the left column's natural height
  // just reaches the right column's, so neither side ends in empty space (the suggestions card then
  // stretches over the last few pixels). Phones show four.
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    const box = suggestBoxRef.current;
    const inner = suggestRef.current;
    if (!left || !right || !box || !inner) return;
    const natural = (col: HTMLElement) => {
      const kids = [...col.children] as HTMLElement[];
      const gap = parseFloat(getComputedStyle(col).rowGap) || 0;
      return kids.reduce((h, k) => {
        if (k !== box) return h + k.offsetHeight;
        const cs = getComputedStyle(box);
        return h + inner.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) * 2;
      }, gap * (kids.length - 1));
    };
    const fit = () => {
      if (window.innerWidth < 1024) return setSuggestCount(4);
      const row = inner.querySelector("li");
      const rowH = row ? row.getBoundingClientRect().height : 76;
      const spare = natural(right) - natural(left);
      const change = Math.floor(spare / rowH);
      if (change) setSuggestCount((n) => Math.max(2, Math.min(16, n + change)));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(right);
    ro.observe(inner);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [cartReady, cart.length]);

  if (!cartReady) return <div className="min-h-[70vh]" />;

  if (cart.length === 0) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="title text-xl md:text-2xl">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted">Add a piece or two and come back here to check out.</p>
        <Link href="/shop" className="btn btn-dark mt-10">
          Shop Now
        </Link>
      </div>
    );
  }

  const errors = Object.fromEntries(Object.entries(CUSTOMER_RULES).map(([k, fn]) => [k, fn(form[k as RuleKey])])) as Record<RuleKey, string>;
  // A code stays chosen if the bag drops below its minimum, but stops counting until it's back above.
  const appliedBlocker = applied ? couponBlocker(applied, subtotal) : "";
  const usable = applied && !appliedBlocker ? applied : null;
  const discount = usable ? Math.round((subtotal * COUPONS[usable].percent) / 100) : 0;
  const shipping = shippingFor(subtotal);
  const giftFee = gift ? GIFT_WRAP.fee : 0;
  const total = subtotal - discount + shipping + giftFee;
  const soldOutLine = cart.find((l) => catalog.getProduct(l.slug)?.soldOut);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "pin") value = value.replace(/\D/g, "").slice(0, 6);
    if (name === "phone") value = value.replace(/[^\d+ ]/g, "").slice(0, 14);
    setForm({ ...form, [name]: value });
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => setTouched({ ...touched, [e.target.name]: true });
  const fieldProps = { form, errors, touched, onChange, onBlur };

  const applyCode = (raw = code) => {
    const c = raw.trim().toUpperCase();
    if (!c) return;
    const why = couponBlocker(c, subtotal);
    if (!why) {
      setApplied(c);
      setCodeMsg("");
      setCode("");
    } else {
      setCodeMsg(why);
    }
  };
  const toggleGift = () => {
    if (gift) {
      setGiftOccasion("");
      setGiftMessage("");
    }
    setGift(!gift);
  };

  const finish = (orderId: string, token: string) => {
    rememberOrder(orderId, token);
    clearCart();
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Nothing to clear.
    }
    router.push(`/orders/${orderId}?t=${token}`);
  };

  const openRazorpay = async ({ order, token, payment }: PlacedOrder) => {
    await loadRazorpay();
    const rzp = new window.Razorpay!({
      key: payment.keyId,
      order_id: payment.razorpayOrderId,
      amount: Math.round(order.total * 100),
      currency: "INR",
      name: "TATTV",
      description: `Order ${order.id}`,
      image: "/brand/mark-black.png",
      prefill: { name: `${order.customer.firstName} ${order.customer.lastName}`, email: order.customer.email, contact: order.customer.phone },
      theme: { color: "#0b0b0b" },
      handler: async (resp: Record<string, string>) => {
        setBusy(true);
        try {
          await api(`/api/orders/${order.id}/pay`, { method: "POST", body: { token, ...resp } });
          finish(order.id, token);
        } catch (e) {
          setError((e as Error).message);
          setBusy(false);
        }
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", (r) => {
      api(`/api/orders/${order.id}/fail`, { method: "POST", body: { token, reason: r.error?.description } }).catch(() => {});
      setError("The payment did not go through. No money was taken, so you can try again.");
    });
    rzp.open();
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched(Object.fromEntries(Object.keys(CUSTOMER_RULES).map((k) => [k, true])));
    const firstBad = (Object.keys(CUSTOMER_RULES) as RuleKey[]).find((k) => errors[k]);
    if (firstBad) {
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    setBusy(true);
    try {
      const res =
        pending ||
        (await api<PlacedOrder>("/api/orders", {
          method: "POST",
          body: {
            customer: form,
            items: cart.map(({ slug, size, qty }) => ({ slug, size, qty })),
            discountCode: usable,
            paymentMethod: payMethod,
            gift: gift ? { wrap: true, occasion: giftOccasion, message: giftMessage } : null,
          },
        }));
      rememberOrder(res.order.id, res.token);
      if (res.payment.mode === "cod") return finish(res.order.id, res.token);
      setPending(res);
      if (res.payment.mode === "razorpay") await openRazorpay(res);
      else setDemo(res);
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      if (/discount|code/i.test(msg)) setApplied(null);
      setBusy(false);
    }
  };

  const payLabel = payMethod === "cod" ? `Place Order · ${formatPrice(total)}` : `Pay ${formatPrice(total)}`;

  return (
    <div className="bg-sand/50 pb-6">
      <div className="container-x pt-8 md:pt-10">
        <div className="flex items-center gap-4">
          <Link href="/shop" aria-label="Continue shopping" className="flex size-10 items-center justify-center rounded-full border border-line bg-white transition-colors hover:border-ink">
            <ArrowLeft size={17} strokeWidth={1.5} />
          </Link>
          <h1 className="title text-xl md:text-2xl">Checkout</h1>
          <ol className="ml-auto hidden items-center gap-3 text-[11px] uppercase tracking-[0.18em] md:flex">
            <li className="text-muted">Bag</li>
            <li className="text-muted">›</li>
            <li className="font-medium">Details &amp; Payment</li>
            <li className="text-muted">›</li>
            <li className="text-muted">Confirmation</li>
          </ol>
        </div>

        <form ref={formRef} onSubmit={placeOrder} noValidate className="mt-7">
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            {/* Left: the bag, gift packing, offers and suggestions. On phones the two columns interleave (see `order-*`). */}
            <div ref={leftRef} className="contents lg:flex lg:flex-col lg:gap-5">
              <section className="order-1 rounded-3xl border border-line bg-white p-5 md:p-6 lg:order-none">
                <div className="flex items-baseline justify-between">
                  <h2 className="eyebrow">Your Bag ({cartCount})</h2>
                  <Link href="/shop" className="text-xs uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink">
                    Add more
                  </Link>
                </div>
                <div className="mt-2 divide-y divide-line">
                  {cart.map((line) => (
                    <CartLineItem key={line.key} line={line} compact />
                  ))}
                </div>
                {soldOutLine && <p className="mt-3 text-sm text-red-700">{catalog.getProduct(soldOutLine.slug)?.name} has just sold out. Please remove it to continue.</p>}
              </section>

              {/* Right under the bag, like ADC's "Goes great with": as many suggestions as fit beside the right-hand column (see fitSuggestions). */}
              <div ref={suggestBoxRef} className="order-5 rounded-3xl border border-line bg-white p-5 md:p-6 lg:order-none lg:flex-1">
                <div ref={suggestRef}>
                  <QuickAddList count={suggestCount} />
                </div>
              </div>

              <Panel title="Gift Packing" icon={<Gift size={13} strokeWidth={1.6} />} className="order-6 lg:order-none">
                <div className="flex items-center gap-4">
                  <p className="flex-1 text-sm leading-relaxed text-ink/75">
                    <span className="block font-medium text-ink">Send it as a gift</span>
                    Packed in the TATTV gift box with a handwritten message card. No prices inside.
                  </p>
                  <button
                    type="button"
                    onClick={toggleGift}
                    aria-pressed={gift}
                    className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors ${
                      gift ? "bg-ink text-white" : "border border-ink text-ink hover:bg-ink hover:text-white"
                    }`}
                  >
                    {gift ? (
                      <>
                        <Check size={14} /> Added
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Add · {formatPrice(GIFT_WRAP.fee)}
                      </>
                    )}
                  </button>
                </div>
                {/* Picking an occasion or writing a message ticks "Add" for you: nobody writes a card and doesn't want the box. */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {GIFT_WRAP.occasions.map((o) => {
                    const on = giftOccasion === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setGiftOccasion(on ? "" : o);
                          if (!on) setGift(true);
                        }}
                        className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${on ? "border-ink bg-ink text-white" : "border-line text-ink/70 hover:border-ink"}`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
                <label htmlFor="co-gift" className="sr-only">
                  Gift message
                </label>
                <textarea
                  id="co-gift"
                  value={giftMessage}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, GIFT_WRAP.messageMax);
                    setGiftMessage(v);
                    if (v.trim()) setGift(true);
                  }}
                  rows={3}
                  placeholder="Write your message for the card…"
                  className="mt-3 block w-full resize-none rounded-2xl border border-[#e5d6bb] bg-[#fbf7f0] px-4 py-3 font-serif text-lg italic leading-relaxed outline-none placeholder:text-ink/35 focus:border-ink"
                />
                <p className="mt-1 text-right text-[11px] text-muted">
                  {giftMessage.length}/{GIFT_WRAP.messageMax}
                </p>
              </Panel>

            </div>

            {/* Right: details, payment and totals */}
            <div ref={rightRef} className="contents lg:flex lg:flex-col lg:gap-5">
              <Panel title="Contact" step={1} className="order-2 lg:order-none">
                <div className="grid gap-4">
                  <Field name="email" label="Email" type="email" autoComplete="email" {...fieldProps} />
                  <Field name="phone" label="Mobile number (for delivery updates)" type="tel" inputMode="tel" autoComplete="tel" {...fieldProps} />
                </div>
              </Panel>

              <Panel title="Delivery Address" step={2} className="order-3 lg:order-none">
                <div className="grid grid-cols-2 gap-4">
                  <Field name="firstName" label="First name" autoComplete="given-name" {...fieldProps} />
                  <Field name="lastName" label="Last name" autoComplete="family-name" {...fieldProps} />
                  <Field name="address" label="House no., street, area" autoComplete="address-line1" className="col-span-2" {...fieldProps} />
                  <Field name="apartment" label="Landmark / apartment (optional)" autoComplete="address-line2" className="col-span-2" {...fieldProps} />
                  <Field name="city" label="City" autoComplete="address-level2" {...fieldProps} />
                  <Field name="pin" label="Pincode" inputMode="numeric" autoComplete="postal-code" {...fieldProps} />
                  <div className="col-span-2">
                    <label htmlFor="co-state" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/70">
                      State
                    </label>
                    <select id="co-state" name="state" value={form.state} onChange={onChange} onBlur={onBlur} autoComplete="address-level1" className={`field ${touched.state && errors.state ? "!border-red-700" : ""}`}>
                      <option value="">Select state</option>
                      {STATES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    {touched.state && errors.state && <p className="mt-1 text-xs text-red-700">{errors.state}</p>}
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-3 rounded-2xl bg-sand px-4 py-3 text-xs leading-relaxed text-ink/75">
                  <Truck size={16} strokeWidth={1.4} className="mt-px shrink-0" />
                  <span>
                    {shipping ? `Shipping ${formatPrice(shipping)}, free on orders above ${formatPrice(FREE_SHIPPING_THRESHOLD)}.` : "Complimentary insured shipping."} Dispatched within 24 hours; tracking is shared once it ships.
                  </span>
                </p>
              </Panel>

              <Panel title="Payment" step={3} className="order-4 lg:order-none">
                <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                  {online && (
                    <label className="flex cursor-pointer items-center gap-4 p-4 text-sm">
                      <input type="radio" name="pay" checked={payMethod === "online"} onChange={() => setPayMethod("online")} className="size-4 accent-ink" />
                      <span className="flex-1">
                        <span className="block font-medium">Pay online</span>
                        <span className="text-xs text-muted">UPI, cards, net banking and wallets via Razorpay</span>
                      </span>
                    </label>
                  )}
                  {cod && (
                    <label className="flex cursor-pointer items-center gap-4 p-4 text-sm">
                      <input type="radio" name="pay" checked={payMethod === "cod"} onChange={() => setPayMethod("cod")} className="size-4 accent-ink" />
                      <span className="flex-1">
                        <span className="block font-medium">Cash on delivery</span>
                        <span className="text-xs text-muted">Pay in cash or UPI when your parcel arrives</span>
                      </span>
                    </label>
                  )}
                </div>
                {online === "demo" && payMethod === "online" && (
                  <p className="mt-3 text-xs text-muted">Demo mode: Razorpay keys aren&apos;t set up yet, so online payment is simulated and no money is charged.</p>
                )}
              </Panel>

              <Panel title="Offers & Coupons" icon={<TicketPercent size={13} strokeWidth={1.6} />} className="order-7 lg:order-none">
                <div className="flex gap-2">
                  <label htmlFor="co-code" className="sr-only">
                    Coupon code
                  </label>
                  <input
                    id="co-code"
                    placeholder="Enter a coupon code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setCodeMsg("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCode();
                      }
                    }}
                    className="field flex-1 uppercase placeholder:normal-case"
                  />
                  <button type="button" onClick={() => applyCode()} disabled={!code.trim()} className="btn btn-outline !px-5 disabled:opacity-40">
                    Apply
                  </button>
                </div>
                {codeMsg && <p className="mt-2 text-xs text-red-700">{codeMsg}</p>}
                <ul className="mt-4 space-y-2.5">
                  {Object.entries(COUPONS).map(([c, info]) => {
                    const on = applied === c;
                    const why = couponBlocker(c, subtotal);
                    return (
                      <li key={c} className={`flex items-center gap-3 rounded-2xl border border-dashed p-3 transition-colors ${on ? "border-ink bg-sand/60" : "border-ink/25"}`}>
                        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${on ? "bg-ink text-white" : "bg-sand text-ink"}`}>
                          <Tag size={16} strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="block font-semibold tracking-[0.08em]">{c}</span>
                          <span className="block text-xs text-muted">{why || info.label}</span>
                        </span>
                        {on ? (
                          <button type="button" aria-label={`Remove ${c}`} onClick={() => setApplied(null)} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-emerald-700 hover:text-ink">
                            <Check size={14} /> Applied <X size={12} className="ml-1" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!!why}
                            onClick={() => applyCode(c)}
                            className="rounded-full border border-ink px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-white disabled:border-line disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted"
                          >
                            Apply
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>

              <Panel title="Order Summary" className="order-8 lg:order-none">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt>
                      Subtotal · {cartCount} {cartCount === 1 ? "item" : "items"}
                    </dt>
                    <dd>{formatPrice(subtotal)}</dd>
                  </div>
                  {usable && (
                    <div className="flex justify-between text-emerald-700">
                      <dt>
                        Coupon {usable} ({COUPONS[usable].percent}%)
                      </dt>
                      <dd>−{formatPrice(discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Shipping</dt>
                    <dd>{shipping ? formatPrice(shipping) : "Complimentary"}</dd>
                  </div>
                  {gift && (
                    <div className="flex justify-between">
                      <dt>Gift packing{giftOccasion && ` · ${giftOccasion}`}</dt>
                      <dd>{formatPrice(giftFee)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-line pt-4 text-base font-medium">
                    <dt>Total</dt>
                    <dd>{formatPrice(total)}</dd>
                  </div>
                </dl>
                <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
                {discount > 0 && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">You save {formatPrice(discount)} on this order.</p>}
                <p className="mt-4 text-xs text-muted">
                  By placing your order you agree to our{" "}
                  <Link href="/help" className="underline underline-offset-2">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/returns" className="underline underline-offset-2">
                    return policy
                  </Link>
                  .
                </p>
              </Panel>
            </div>
          </div>

          {/* The pay button floats centred at the bottom of the screen until the form ends, then rests under it. */}
          <div className="sticky bottom-3 z-30 mx-auto mt-6 max-w-xl md:bottom-5">
            {error && (
              <p role="alert" className="mb-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-800 shadow-soft">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy || !!soldOutLine} className="btn btn-dark h-14 w-full text-[13px] shadow-lift disabled:opacity-50">
              <Lock size={15} /> {busy ? "Please wait…" : payLabel}
            </button>
          </div>
        </form>
      </div>

      {demo && (
        <DemoPayment
          amount={demo.order.total}
          orderId={demo.order.id}
          onSuccess={async () => {
            await api(`/api/orders/${demo.order.id}/pay`, { method: "POST", body: { token: demo.token } });
            finish(demo.order.id, demo.token);
          }}
          onFailure={() => {
            api(`/api/orders/${demo.order.id}/fail`, { method: "POST", body: { token: demo.token, reason: "Simulated failure" } }).catch(() => {});
            setDemo(null);
            setBusy(false);
            setError("The payment did not go through. No money was taken, so you can try again.");
          }}
          onDismiss={() => {
            setDemo(null);
            setBusy(false);
          }}
        />
      )}
    </div>
  );
}

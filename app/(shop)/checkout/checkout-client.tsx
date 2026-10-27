"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Lock, Tag, Truck, X } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { CartLineItem } from "@/components/cart-line-item";
import { QuickAddList } from "@/components/quick-add-list";
import { DemoPayment } from "@/components/demo-payment";
import { COUPONS } from "@/lib/site";
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

const Panel = ({ title, step, children }: { title: string; step?: number; children: React.ReactNode }) => (
  <section className="rounded-3xl border border-line bg-white p-5 md:p-6">
    <h2 className="eyebrow mb-5 flex items-center gap-3">
      {step && <span className="flex size-6 items-center justify-center rounded-full bg-ink text-[10px] tracking-normal text-white">{step}</span>}
      {title}
    </h2>
    {children}
  </section>
);

/**
 * Checkout on one screen. Left: the bag (editable) and "Complete the Look" quick-adds. Right:
 * contact, address, payment, discount code, totals and the pay button. Prices are shown here
 * for convenience; the server re-prices the order when it is placed.
 */
export function CheckoutClient({ online, cod }: { online: "razorpay" | "demo" | null; cod: boolean }) {
  const router = useRouter();
  const { cart, cartCount, subtotal, cartReady, clearCart, catalog } = useStore();
  const [form, setForm] = useState<CustomerInput>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const [codeMsg, setCodeMsg] = useState("");
  const [payMethod, setPayMethod] = useState<"online" | "cod">(online ? "online" : "cod");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState<PlacedOrder | null>(null);
  // An online order waiting for payment, reused if the customer retries without changing anything.
  const [pending, setPending] = useState<PlacedOrder | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
  useEffect(() => setPending(null), [cart, applied, payMethod]);

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
  const discount = applied ? Math.round((subtotal * COUPONS[applied].percent) / 100) : 0;
  const shipping = shippingFor(subtotal);
  const total = subtotal - discount + shipping;
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

  const applyCode = () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    if (COUPONS[c]) {
      setApplied(c);
      setCodeMsg("");
      setCode("");
    } else {
      setApplied(null);
      setCodeMsg("That code is not valid");
    }
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
          body: { customer: form, items: cart.map(({ slug, size, qty }) => ({ slug, size, qty })), discountCode: applied, paymentMethod: payMethod },
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

  const payLabel = payMethod === "cod" ? "Place Order" : `Pay ${formatPrice(total)}`;

  return (
    <div className="bg-sand/50 pb-28 lg:pb-16">
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

        <form ref={formRef} onSubmit={placeOrder} noValidate className="mt-7 grid items-start gap-5 lg:grid-cols-12 lg:gap-8">
          {/* Left: the bag and recommendations */}
          <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-5">
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

            <div className="order-3 rounded-3xl border border-line bg-white p-5 md:p-6 lg:order-none">
              <QuickAddList count={4} />
            </div>
          </div>

          {/* Right: details, payment and totals */}
          <div className="order-2 space-y-5 lg:sticky lg:top-24 lg:col-span-5">
            <Panel title="Contact" step={1}>
              <div className="grid gap-4">
                <Field name="email" label="Email" type="email" autoComplete="email" {...fieldProps} />
                <Field name="phone" label="Mobile number (for delivery updates)" type="tel" inputMode="tel" autoComplete="tel" {...fieldProps} />
              </div>
            </Panel>

            <Panel title="Delivery Address" step={2}>
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

            <Panel title="Payment" step={3}>
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

            <section className="rounded-3xl border border-line bg-white p-5 md:p-6">
              <div className="flex gap-2">
                <label htmlFor="co-code" className="sr-only">
                  Discount code
                </label>
                <input
                  id="co-code"
                  placeholder="Discount code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyCode();
                    }
                  }}
                  className="field flex-1 uppercase placeholder:normal-case"
                />
                <button type="button" onClick={applyCode} disabled={!code.trim()} className="btn btn-outline !px-5 disabled:opacity-40">
                  Apply
                </button>
              </div>
              {codeMsg && <p className="mt-2 text-xs text-red-700">{codeMsg}</p>}
              {applied && (
                <p className="mt-3 flex items-center gap-2 text-sm">
                  <Tag size={14} /> <b className="font-medium">{applied}</b> · {COUPONS[applied].label}
                  <button type="button" aria-label="Remove code" onClick={() => setApplied(null)} className="ml-auto text-muted hover:text-ink">
                    <X size={14} />
                  </button>
                </p>
              )}

              <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal · {cartCount} {cartCount === 1 ? "item" : "items"}</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                {applied && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Discount ({COUPONS[applied].percent}%)</dt>
                    <dd>−{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{shipping ? formatPrice(shipping) : "Complimentary"}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-4 text-base font-medium">
                  <dt>Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>
              <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>

              {error && (
                <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy || !!soldOutLine} className="btn btn-dark mt-5 hidden w-full disabled:opacity-50 lg:flex">
                <Lock size={14} /> {busy ? "Please wait…" : payLabel}
              </button>
              <p className="mt-3 text-center text-xs text-muted">
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
            </section>
          </div>
        </form>
      </div>

      {/* Mobile: the total and pay button stay in reach */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-white px-5 py-3 lg:hidden">
        <p className="leading-tight">
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">Total</span>
          <span className="text-lg font-medium">{formatPrice(total)}</span>
        </p>
        <button type="button" disabled={busy || !!soldOutLine} onClick={() => formRef.current?.requestSubmit()} className="btn btn-dark disabled:opacity-50">
          <Lock size={14} /> {busy ? "Please wait…" : payMethod === "cod" ? "Place Order" : "Pay Now"}
        </button>
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

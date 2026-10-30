"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check, Package, ShoppingBag } from "lucide-react";
import { Confetti } from "@/components/confetti";
import { useCatalog, useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_LABELS, TRACKER_STEPS, whatsappLink, type OrderStatus, type PaymentStatus } from "@/lib/site";
import { api, orderToken, rememberOrder } from "@/lib/client-api";
import { RateOrder } from "./rate-order";

interface OrderView {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: { firstName: string; lastName: string; email: string; phone: string; address: string; apartment: string; city: string; state: string; pin: string };
  lines: { slug: string; name: string; size: string | null; price: number; qty: number; image: string }[];
  subtotal: number;
  discount: number;
  discountCode: string | null;
  shipping: number;
  gift: { fee: number; occasion: string; message: string } | null;
  total: number;
  payment: { method: string; plan?: "full" | "advance"; advance?: number; status: PaymentStatus };
  tracking: { courier: string; number: string; url: string } | null;
}

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function OrderView({ id }: { id: string }) {
  const params = useSearchParams();
  const [order, setOrder] = useState<OrderView | null | undefined>(undefined);
  const [celebrate, setCelebrate] = useState(false);
  const { account } = useStore();
  const { settings } = useCatalog();

  useEffect(() => {
    const t = params.get("t");
    if (t) rememberOrder(id, t);
    const token = t || orderToken(id);
    const load = () =>
      api<{ order: OrderView }>(`/api/orders/${id}${token ? `?t=${token}` : ""}`)
        .then((d) => setOrder(d.order))
        .catch(() => setOrder((o) => o ?? null));
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [id, params]);

  // Confetti the first time a confirmed order is opened on this device, not on later visits.
  const live = !!order && order.status !== "pending_payment" && order.status !== "cancelled";
  useEffect(() => {
    if (!live) return;
    const key = `tattv.celebrated.${id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      // Storage unavailable: celebrate anyway.
    }
    setCelebrate(true);
  }, [live, id]);

  if (order === undefined) return <div className="min-h-[60vh]" />;
  if (order === null) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="title text-xl md:text-2xl">Order not found</h1>
        <p className="mt-3 text-muted">We couldn&apos;t open order {id}. Find it with your email or mobile number instead.</p>
        <Link href={`/orders/track?id=${id}`} className="btn btn-dark mt-10">
          Track an Order
        </Link>
      </div>
    );
  }

  const c = order.customer;
  const awaiting = order.status === "pending_payment";
  const cancelled = order.status === "cancelled";
  const step = TRACKER_STEPS.indexOf(order.status);
  const help = whatsappLink(`Hi TATTV! A question about my order ${order.id}`, settings.phone);
  const token = params.get("t") || orderToken(order.id);

  return (
    <div className="container-x max-w-3xl py-12 md:py-16">
      <section className="relative rounded-3xl border border-line bg-white p-6 text-center md:p-10">
        {!awaiting && !cancelled && (
          <div className="relative mx-auto size-14">
            {celebrate && (
              <>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border-2 border-[#c9a35c]"
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 2.6, opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
                <div className="absolute inset-x-0 top-1/2">
                  <Confetti />
                </div>
              </>
            )}
            <motion.span
              className="relative flex size-14 items-center justify-center rounded-full bg-ink text-white"
              initial={celebrate ? { scale: 0.4 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 14 }}
            >
              <Check size={26} />
            </motion.span>
          </div>
        )}
        <p className="eyebrow mt-6 text-muted">Order {order.id}</p>
        <h1 className="title mt-3 text-xl md:text-2xl">
          {awaiting ? (order.payment.status === "failed" ? "Payment didn’t go through" : "Waiting for payment") : cancelled ? "This order was cancelled" : `Thank you${c.firstName ? `, ${c.firstName}` : ""}`}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          {awaiting ? (
            <>
              No money has been taken for this order. Go back to <Link href="/checkout" className="underline underline-offset-2">checkout</Link> to try again, or choose cash on delivery.
            </>
          ) : cancelled ? (
            <>
              Questions?{" "}
              <a href={help} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Message us on WhatsApp
              </a>
              .
            </>
          ) : (
            <>Your order is confirmed. We dispatch within 24 hours and share tracking details as soon as it ships. Bookmark this page to follow it.</>
          )}
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line text-left text-sm md:grid-cols-4">
          {[
            ["Status", ORDER_STATUSES[order.status]?.customer],
            [
              "Payment",
              order.payment.plan === "advance" && order.payment.status === "cod_due"
                ? `${formatPrice(order.payment.advance ?? 0)} paid · ${formatPrice(order.total - (order.payment.advance ?? 0))} on delivery`
                : order.payment.method === "cod"
                  ? "Cash on delivery"
                  : PAYMENT_LABELS[order.payment.status],
            ],
            ["Placed", when(order.createdAt)],
            ["Total", formatPrice(order.total)],
          ].map(([k, v]) => (
            <div key={k} className="bg-white p-4">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">{k}</dt>
              <dd className="mt-1 font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {step >= 0 && (
          <ol className="mt-8 grid grid-cols-5 gap-2 text-[10px] uppercase tracking-[0.12em]" aria-label="Delivery progress">
            {TRACKER_STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined} className={i <= step ? "text-ink" : "text-muted"}>
                <span className={`mb-2 block h-1 rounded-full ${i <= step ? "bg-ink" : "bg-line"}`} />
                {ORDER_STATUSES[s].customer}
              </li>
            ))}
          </ol>
        )}

        {/* The courier's AWB (waybill) number and their own tracking page, for every scan and place. */}
        {order.tracking && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-3xl bg-sand px-5 py-4 text-left text-sm sm:flex-row">
            <p className="flex items-center gap-3">
              <Package size={18} strokeWidth={1.5} className="shrink-0" />
              <span>
                Shipped with <b className="font-medium">{order.tracking.courier || "our courier"}</b>
                {order.tracking.number && (
                  <span className="block text-xs text-ink/70">
                    AWB <b className="font-medium tracking-[0.06em] text-ink">{order.tracking.number}</b>
                  </span>
                )}
              </span>
            </p>
            {order.tracking.url && (
              <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="btn btn-dark h-10 shrink-0 px-5 text-[11px]">
                Track on {order.tracking.courier || "courier"} <ArrowRight size={14} />
              </a>
            )}
          </div>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="btn btn-outline h-12 px-7">
            <ShoppingBag size={15} strokeWidth={1.6} /> Continue Shopping
          </Link>
          <Link href={account ? "/account" : `/orders/track?id=${order.id}`} className="btn btn-dark h-12 px-7">
            Track Your Order <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {order.status === "delivered" && token && (
        <div id="review" className="scroll-mt-28">
          <RateOrder orderId={order.id} token={token} />
        </div>
      )}

      <section className="mt-5 rounded-3xl border border-line bg-white p-6 md:p-8">
        <h2 className="eyebrow">Items</h2>
        <ul className="mt-4 divide-y divide-line">
          {order.lines.map((l) => (
            <li key={`${l.slug}|${l.size}`} className="flex items-center gap-4 py-4">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-sand">
                {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />}
                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">{l.qty}</span>
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <Link href={`/product/${l.slug}`} className="font-medium hover:underline">
                  {l.name}
                </Link>
                <span className="block text-xs text-muted">
                  {formatPrice(l.price)} each{l.size && ` · ${l.size}`}
                </span>
              </span>
              <span className="text-sm">{formatPrice(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount ({order.discountCode})</dt>
              <dd>−{formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{order.shipping ? formatPrice(order.shipping) : "Complimentary"}</dd>
          </div>
          {order.gift && order.gift.fee > 0 && (
            <div className="flex justify-between">
              <dt>Gift packing{order.gift.occasion && ` · ${order.gift.occasion}`}</dt>
              <dd>{formatPrice(order.gift.fee)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      {order.gift?.message && (
        <section className="mt-5 rounded-3xl border border-[#e5d6bb] bg-[#fbf7f0] p-6 md:p-8">
          <h2 className="eyebrow">Your Gift Card</h2>
          <p className="mt-4 font-serif text-xl italic leading-relaxed">&ldquo;{order.gift.message}&rdquo;</p>
        </section>
      )}

      <section className="mt-5 rounded-3xl border border-line bg-white p-6 md:p-8">
        <h2 className="eyebrow">Delivery Address</h2>
        <address className="mt-4 text-sm not-italic leading-relaxed text-ink/80">
          {c.firstName} {c.lastName}
          <br />
          {c.address}
          {c.apartment ? `, ${c.apartment}` : ""}
          <br />
          {c.city}, {c.state} {c.pin}
          <br />
          {c.phone} · {c.email}
        </address>
      </section>

      <p className="mt-8 text-center text-sm text-muted">
        Need help?{" "}
        <a href={help} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          WhatsApp us
        </a>{" "}
        with your order number ·{" "}
        <Link href="/shop" className="underline underline-offset-2">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}

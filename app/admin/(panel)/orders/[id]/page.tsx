import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_LABELS, SITE_URL, cashDue, type OrderStatus } from "@/lib/site";
import { getOrder, type Order } from "@/lib/server/orders";
import { addNote, saveTracking, setPayment, updateStatus } from "../../../actions";
import { PageHead, StatusPill, when } from "../../ui";
import { delhiveryConfigured } from "@/lib/server/delhivery";
import { weighLines } from "@/lib/server/pickup";
import { DelhiveryPanel } from "./delhivery-panel";
import { MoneyPanel } from "./money-panel";
import { REFUND_REASONS, canCancel, moneyOf } from "@/lib/server/refunds";
import { activeShipment } from "@/lib/server/shipments";
import { ownerCodes } from "@/lib/server/otp";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Order ${(await params).id}` };
}

// The usual next step for each status, offered as a one-click button.
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { confirmed: "packed", packed: "shipped", shipped: "out_for_delivery", out_for_delivery: "delivered" };

function whatsappMessage(o: Order) {
  const name = o.customer.firstName;
  const link = `${SITE_URL}/orders/${o.id}?t=${o.token}`;
  const t = o.tracking;
  const msgs: Record<OrderStatus, string> = {
    confirmed: `Hi ${name}! Thank you for your TATTV order ${o.id}. We're preparing it now and will share tracking once it ships. ${link}`,
    packed: `Hi ${name}! Your TATTV order ${o.id} is packed and will be shipped soon. ${link}`,
    shipped: `Hi ${name}! Your TATTV order ${o.id} is on its way${t ? ` with ${t.courier}${t.number ? `, tracking no. ${t.number}` : ""}` : ""}. ${t?.url || link}`,
    out_for_delivery: `Hi ${name}! Your TATTV order ${o.id} is out for delivery today.${o.payment.status === "cod_due" ? ` Please keep ${formatPrice(cashDue(o))} ready.` : ""}`,
    delivered: `Hi ${name}! Your TATTV order ${o.id} has been delivered. We hope you enjoy wearing it.`,
    pending_payment: `Hi ${name}! We noticed your TATTV order ${o.id} wasn't paid. Can we help you complete it?`,
    cancelled: `Hi ${name}, your TATTV order ${o.id} has been cancelled. Please reply if you have any questions.`,
  };
  return `https://wa.me/91${o.customer.phone}?text=${encodeURIComponent(msgs[o.status] || "")}`;
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) notFound();
  const c = o.customer;
  const next = NEXT[o.status];
  const address = [`${c.firstName} ${c.lastName}`, c.address, c.apartment, `${c.city}, ${c.state} ${c.pin}`, `Phone: ${c.phone}`].filter(Boolean).join("\n");

  return (
    <>
      <PageHead
        back={{ href: "/admin/orders", label: "Orders" }}
        title={
          <>
            Order {o.id} <StatusPill status={o.status} />
          </>
        }
        sub={`Placed ${when(o.createdAt)}`}
      >
        <a href={whatsappMessage(o)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
          WhatsApp Customer
        </a>
        <a href={`/admin/slip/${o.id}`} target="_blank" className="btn btn-outline btn-sm">
          Packing Slip
        </a>
      </PageHead>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="adm-card">
            <h2 className="adm-h2">Items</h2>
            <ul className="divide-y divide-line">
              {o.lines.map((l) => (
                <li key={`${l.slug}|${l.size}`} className="flex items-center gap-4 py-3">
                  <span className="relative size-14 shrink-0 rounded-xl bg-sand [&_img]:rounded-xl">
                    {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}
                    <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">{l.qty}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{l.name}</span>
                    <span className="block text-xs text-muted">
                      {formatPrice(l.price)} × {l.qty}
                      {l.size && ` · Size ${l.size}`}
                    </span>
                  </span>
                  <b className="text-sm font-medium">{formatPrice(l.price * l.qty)}</b>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPrice(o.subtotal)}</dd>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount ({o.discountCode})</dt>
                  <dd>−{formatPrice(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{o.shipping ? formatPrice(o.shipping) : "Free"}</dd>
              </div>
              {o.gift && o.gift.fee > 0 && (
                <div className="flex justify-between">
                  <dt>Gift packing</dt>
                  <dd>{formatPrice(o.gift.fee)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(o.total)}</dd>
              </div>
            </dl>
          </section>

          {o.gift && (
            <section className="adm-card border-[#e5d6bb] bg-[#fbf7f0]">
              <h2 className="adm-h2">🎁 Gift packing{o.gift.occasion && ` · ${o.gift.occasion}`}</h2>
              <p className="text-sm text-ink/75">Pack in the TATTV gift box, no invoice inside. Write this on the message card:</p>
              <blockquote className="mt-3 rounded-2xl bg-white px-5 py-4 font-serif text-lg italic leading-relaxed">
                {o.gift.message ? `“${o.gift.message}”` : <span className="text-sm not-italic text-muted">No message: leave the card blank.</span>}
              </blockquote>
            </section>
          )}

          <section className="adm-card space-y-4">
            <h2 className="adm-h2 !mb-0">Update status</h2>
            {next && (
              <form action={updateStatus}>
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="status" value={next} />
                <button className="btn btn-dark btn-sm">Mark as {ORDER_STATUSES[next].label.toLowerCase()}</button>
              </form>
            )}
            <form key={o.status} action={updateStatus} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={o.id} />
              <label className="sr-only" htmlFor="st">
                Status
              </label>
              <select id="st" name="status" defaultValue={o.status} className="adm-input w-auto">
                {Object.entries(ORDER_STATUSES).filter(([k]) => k !== "cancelled" || o.status === "cancelled").map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <input name="statusNote" placeholder="Note for the timeline (optional)" aria-label="Status note" className="adm-input min-w-48 flex-1" />
              <button className="btn btn-outline btn-sm">Save</button>
            </form>
            <p className="text-xs text-muted">To cancel, use Cancel or refund below: it needs the owner&apos;s code, refunds the money and puts the items back in stock.</p>
          </section>

          <MoneyPanel
            id={o.id}
            canCancel={canCancel(o)}
            money={await moneyOf(o).catch(() => null)}
            waybill={activeShipment(o)?.waybill ?? null}
            refunds={o.refunds}
            reasons={Object.entries(REFUND_REASONS)}
            codesReady={!!ownerCodes()}
            widget={ownerCodes() === "widget" ? { widgetId: process.env.MSG91_WIDGET_ID!, tokenAuth: process.env.MSG91_WIDGET_TOKEN! } : null}
          />

          <DelhiveryPanel
            id={o.id}
            shipment={o.shipment}
            configured={delhiveryConfigured()}
            canBook={!["pending_payment", "cancelled", "delivered"].includes(o.status)}
            defaultGrams={(await weighLines(o.lines)).total}
            cod={cashDue(o)}
          />

          <section className="adm-card">
            <h2 className="adm-h2">Shipping &amp; tracking</h2>
            <form action={saveTracking} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={o.id} />
              <div>
                <label htmlFor="tc" className="adm-label">
                  Courier
                </label>
                <input id="tc" name="courier" defaultValue={o.tracking?.courier} placeholder="e.g. Delhivery, DTDC" className="adm-input" />
              </div>
              <div>
                <label htmlFor="tn" className="adm-label">
                  Tracking number
                </label>
                <input id="tn" name="number" defaultValue={o.tracking?.number} className="adm-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="tu" className="adm-label">
                  Tracking link (optional)
                </label>
                <input id="tu" name="url" type="url" defaultValue={o.tracking?.url} placeholder="https://" className="adm-input" />
              </div>
              {["confirmed", "packed"].includes(o.status) && (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" name="markShipped" defaultChecked className="size-4 accent-ink" /> Also mark the order as shipped
                </label>
              )}
              <div className="sm:col-span-2">
                <button className="btn btn-outline btn-sm">Save Tracking</button>
                <p className="mt-2 text-xs text-muted">The customer sees this on their order page.</p>
              </div>
            </form>
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">Timeline</h2>
            <ol className="space-y-3 border-l border-line pl-5 text-sm">
              {[...o.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-ink" />
                  <b className="font-medium">{ORDER_STATUSES[h.status]?.label}</b>
                  {h.note ? ` · ${h.note}` : ""}
                  <span className="block text-xs text-muted">
                    {when(h.at)}
                    {h.byAdmin ? " · by admin" : ""}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="adm-card">
            <h2 className="adm-h2">Customer</h2>
            <p className="text-sm leading-relaxed">
              <b className="font-medium">
                {c.firstName} {c.lastName}
              </b>
              <br />
              <a href={`mailto:${c.email}`} className="underline-offset-2 hover:underline">
                {c.email}
              </a>
              <br />
              <a href={`tel:+91${c.phone}`} className="underline-offset-2 hover:underline">
                +91 {c.phone}
              </a>
            </p>
            <h3 className="adm-label mt-5">Ship to</h3>
            <pre className="whitespace-pre-wrap rounded-2xl bg-sand p-4 font-sans text-sm leading-relaxed">{address}</pre>
            <Link href={`/admin/orders?status=all&q=${encodeURIComponent(c.email)}`} className="mt-3 inline-block text-xs uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-ink">
              Other orders from this customer
            </Link>
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">Payment</h2>
            <p className="text-sm leading-relaxed">
              {o.payment.plan === "advance"
                ? `Cash on delivery with ${formatPrice(o.payment.advance)} advance ${o.payment.method === "demo" ? "(demo, not real money)" : "via Razorpay"}`
                : o.payment.method === "cod"
                  ? "Cash on delivery"
                  : o.payment.method === "demo"
                    ? "Online (demo, not real money)"
                    : "Online via Razorpay"}
              <br />
              <b className="font-medium">{PAYMENT_LABELS[o.payment.status]}</b>
              {o.payment.plan === "advance" && o.payment.status === "cod_due" && (
                <span className="block text-sm">
                  Advance paid {formatPrice(o.payment.advance)} · <b className="font-medium">collect {formatPrice(cashDue(o))}</b> on delivery
                </span>
              )}
              {o.payment.paymentId && <span className="block text-xs text-muted">Payment ID: {o.payment.paymentId}</span>}
              {o.payment.razorpayOrderId && <span className="block text-xs text-muted">Razorpay order: {o.payment.razorpayOrderId}</span>}
            </p>
            <form action={setPayment} className="mt-4 flex gap-2">
              <input type="hidden" name="id" value={o.id} />
              {o.payment.status === "cod_due" && (
                <button name="paymentStatus" value="paid" className="btn btn-dark btn-sm">
                  Cash Collected
                </button>
              )}
            </form>
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">Internal notes</h2>
            {o.notes.length === 0 ? (
              <p className="text-xs text-muted">Only the team can see these.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {o.notes.map((n, i) => (
                  <li key={i}>
                    {n.text}
                    <span className="block text-xs text-muted">{when(n.at)}</span>
                  </li>
                ))}
              </ul>
            )}
            <form action={addNote} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={o.id} />
              <label htmlFor="nt" className="sr-only">
                Note
              </label>
              <textarea id="nt" name="note" rows={2} placeholder="e.g. Gift wrap requested" className="adm-input" />
              <button className="btn btn-outline btn-sm">Add Note</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}

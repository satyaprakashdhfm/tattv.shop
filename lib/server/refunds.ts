import "server-only";
import { OrderError, normalisePhone } from "@/lib/pricing";
import { CONTACT } from "@/lib/site";
import { formatPrice } from "@/lib/format";
import { query, transaction } from "./db";
import { sendMail, storeInbox } from "./mail";
import { adminUpdateOrder, getOrder, type Order, type Refund } from "./orders";
import { activeShipment, cancelBooking } from "./shipments";
import { checkOtp, ownerCodes, sendOtp, showCode, verifyWidgetToken } from "./otp";
import { createRefund, fetchPayment } from "./razorpay";

// Cancel an order, or send money back, behind a one-time code sent to the owner's mobile (OWNER_PHONE, else
// the store's contact number), as on Minimalstoys. Whoever is at the admin screen can't approve their own
// refund: the owner reads the code out, and that is the approval. Customers never cancel on the site.
//
// A code is tied to one order and to what it was asked for: the amount of a refund is fixed when the code
// is sent, so a code asked for ₹50 can't send back ₹5,000. Asking again replaces the earlier code.

export const REFUND_REASONS = {
  damaged: { label: "Damaged piece", line: "Part of your order reached you damaged." },
  missing: { label: "Missing item", line: "Something was missing from your order." },
  wrong: { label: "Wrong item sent", line: "We sent you the wrong piece." },
  late: { label: "Late delivery", line: "Your order reached you later than it should have." },
  goodwill: { label: "Goodwill", line: "A little something back from us." },
  other: { label: "Something else", line: "" },
} as const;
export type RefundReason = keyof typeof REFUND_REASONS;

export type MoneyIntent = { kind: "cancel"; reason: string } | { kind: "refund"; amount: number; reasonCode: RefundReason; note: string };

const SCOPE = (id: string) => `money:${id}`;
const g = globalThis as unknown as { __tattvRefunds?: Set<string> };
const inFlight = (g.__tattvRefunds ??= new Set()); // orders with money moving right now
const paise = (rs: number) => Math.round(Number(rs) * 100);
const isRazorpay = (o: Order) => o.payment.method !== "demo" && !!o.payment.paymentId?.startsWith("pay_");

export function ownerPhone() {
  const p = normalisePhone(process.env.OWNER_PHONE || CONTACT.phone);
  return /^[6-9]\d{9}$/.test(p) ? p : "";
}
const hint = (p: string) => `••••••${p.slice(-4)}`;

/**
 * What was paid online for this order, what has gone back, and what is left to refund, in rupees. Cash
 * paid to the courier isn't counted: it can't go back through Razorpay. Razorpay's own figures win.
 */
export async function moneyOf(o: Order) {
  const p = o.payment;
  const ours = o.refunds.reduce((s, r) => s + r.amount, 0);
  if (isRazorpay(o)) {
    const r = await fetchPayment(p.paymentId!);
    if (!r.ok) throw new OrderError(`Could not read the payment from Razorpay: ${r.reason}`, 502);
    const paid = ["captured", "refunded"].includes(r.data.status) ? r.data.amount / 100 : 0;
    const refunded = (r.data.amount_refunded || 0) / 100;
    return { paid, refunded, left: Math.max(0, paid - refunded), live: true };
  }
  const paidOnline = !p.paymentId ? 0 : p.plan === "advance" ? p.advance : ["paid", "refunded"].includes(p.status) ? o.total : 0;
  return { paid: paidOnline, refunded: ours, left: Math.max(0, paidOnline - ours), live: false };
}

export function canCancel(o: Order) {
  return !["cancelled", "delivered", "pending_payment"].includes(o.status);
}

function cancellable(o: Order | null): asserts o is Order {
  if (!o) throw new OrderError("Order not found", 404);
  if (o.status === "cancelled") throw new OrderError("This order is already cancelled.");
  if (o.status === "delivered") throw new OrderError("This order was delivered. Use Refund instead to send money back.");
  if (o.status === "pending_payment") throw new OrderError("This order was never paid, so there is nothing to cancel.");
}

/** Step 1: check the request and text the owner a code for it. */
export async function requestMoneyCode(id: string, input: { kind?: unknown; reason?: unknown; reasonCode?: unknown; amount?: unknown; note?: unknown }) {
  const o = await getOrder(id);
  const owner = ownerPhone();
  if (!owner) throw new OrderError("The owner's mobile number isn't valid (OWNER_PHONE), so no code can be sent.");
  const via = ownerCodes();
  if (!via) throw new OrderError("SMS codes are not set up yet (MSG91), so cancelling and refunding can't be approved here.");

  let intent: MoneyIntent;
  if (input.kind === "cancel") {
    cancellable(o);
    const reason = String(input.reason || "").trim();
    if (!reason) throw new OrderError("Write a reason. The customer sees it.");
    if (reason.length > 300) throw new OrderError("Keep the reason under 300 characters.");
    intent = { kind: "cancel", reason };
  } else if (input.kind === "refund") {
    if (!o) throw new OrderError("Order not found", 404);
    const code = String(input.reasonCode || "") as RefundReason;
    const r = REFUND_REASONS[code];
    if (!r) throw new OrderError("Pick a reason for the refund.");
    const note = String(input.note || "").trim().slice(0, 300);
    if (!r.line && !note) throw new OrderError('Write a line for the customer: with "Something else" it is the only reason they see.');
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || paise(amount) < 100) throw new OrderError("Enter an amount of at least ₹1.");
    const m = await moneyOf(o);
    if (paise(amount) > paise(m.left)) throw new OrderError(m.left > 0 ? `Only ${formatPrice(m.left)} is left to refund on this order.` : "Nothing paid online is left to refund on this order.");
    intent = { kind: "refund", amount: paise(amount) / 100, reasonCode: code, note };
  } else {
    throw new OrderError("Unknown request.");
  }

  await query(
    `INSERT INTO money_codes (order_id, intent, at) VALUES ($1, $2, now())
     ON CONFLICT (order_id) DO UPDATE SET intent = EXCLUDED.intent, at = now()`,
    [id, JSON.stringify(intent)],
  );
  console.log(`[MONEY] code asked for | order=${id} | ${intent.kind}${intent.kind === "refund" ? ` ₹${intent.amount}` : ""} | owner=****${owner.slice(-4)}`);
  // With MSG91's widget the admin page sends the code to the owner (after its captcha); the server then
  // accepts only a check MSG91 made for the owner's number. Otherwise our own code goes out from here.
  if (via === "widget") return { phoneHint: hint(owner), intent, widgetPhone: owner };
  const sent = await sendOtp(owner, { scope: SCOPE(id) });
  return { phoneHint: hint(owner), intent, ...(showCode() && sent.code ? { code: sent.code } : {}) };
}

/** Step 2: the code comes back. Only now does anything happen. */
export async function confirmMoneyCode(id: string, { code, accessToken }: { code?: string; accessToken?: string }) {
  const pending = (await query<{ intent: MoneyIntent }>("SELECT intent FROM money_codes WHERE order_id = $1", [id])).rows[0];
  if (!pending) throw new OrderError("Ask for a new code first.");
  if (inFlight.has(id)) throw new OrderError("This order is already being cancelled or refunded. Give it a moment.");
  inFlight.add(id);
  try {
    if (accessToken) {
      const phone = await verifyWidgetToken(accessToken); // a token works once
      if (phone !== ownerPhone()) throw new OrderError("That code was not sent to the owner's mobile.", 403);
    } else {
      await checkOtp(ownerPhone(), code, { scope: SCOPE(id) }); // throws on a wrong or old code; a right one is used up
    }
    // Used once: a second confirm with the same request finds nothing.
    const taken = await query("DELETE FROM money_codes WHERE order_id = $1", [id]);
    if (!taken.rowCount) throw new OrderError("Ask for a new code first.");
    const { intent } = pending;
    console.log(`[MONEY] approved | order=${id} | ${intent.kind}`);
    return intent.kind === "cancel" ? await cancelOrder(id, intent.reason) : await refund(id, intent);
  } finally {
    inFlight.delete(id);
  }
}

/** Sends `amount` back and writes it on the order. */
async function sendBack(o: Order, amount: number, { reason, note }: { reason: string; note: string }) {
  let refundId: string;
  if (isRazorpay(o)) {
    const r = await createRefund(o.payment.paymentId!, { amountPaise: paise(amount), notes: { order: o.id, reason: reason.slice(0, 200) } });
    if (!r.ok) throw new OrderError(`Razorpay refused the refund: ${String(r.reason).slice(0, 200)}`, 502);
    refundId = r.data.id;
  } else {
    refundId = "demo_rfnd_" + Date.now().toString(36); // demo payments: nothing to send back
  }
  const entry: Refund = { at: new Date().toISOString(), amount, reason, note, refundId };
  await transaction(async (db) => {
    const row = (await db.query<{ refunds: Refund[] }>("SELECT refunds FROM orders WHERE id = $1 FOR UPDATE", [o.id])).rows[0];
    const refunds = [...(row?.refunds ?? []), entry];
    const back = refunds.reduce((s, r) => s + r.amount, 0);
    const paidOnline = o.payment.plan === "advance" ? o.payment.advance : o.total;
    await db.query("UPDATE orders SET refunds = $2 WHERE id = $1", [o.id, JSON.stringify(refunds)]);
    // A fully refunded prepaid order; an advance order keeps its cash-on-delivery status for the courier.
    if (o.payment.plan === "full" && paise(back) >= paise(paidOnline)) await db.query("UPDATE orders SET payment_status = 'refunded' WHERE id = $1", [o.id]);
    await db.query("INSERT INTO order_events (order_id, status, note, by_admin) VALUES ($1, $2, $3, true)", [
      o.id, o.status, `Refund of ${formatPrice(amount)}: ${[reason, note].filter(Boolean).join(" · ")}`.slice(0, 300),
    ]);
    await db.query("INSERT INTO order_notes (order_id, text) VALUES ($1, $2)", [o.id, `Refunded ${formatPrice(amount)} (${refundId}). Razorpay settles it in 5–7 working days.`]);
  });
  console.log(`[MONEY] refund | order=${o.id} | ₹${amount} | ${refundId}`);
}

async function refund(id: string, intent: Extract<MoneyIntent, { kind: "refund" }>) {
  const o = await getOrder(id);
  if (!o) throw new OrderError("Order not found", 404);
  const m = await moneyOf(o); // checked again: something may have gone back since the code was sent
  if (paise(intent.amount) > paise(m.left)) throw new OrderError(`Only ${formatPrice(m.left)} is left to refund on this order.`);
  const r = REFUND_REASONS[intent.reasonCode];
  const note = intent.note || r.line;
  await sendBack(o, intent.amount, { reason: r.label, note });
  await tellCustomer(o, `We've refunded ${formatPrice(intent.amount)} on your TATTV order ${o.id}`, [
    note,
    "",
    `${formatPrice(intent.amount)} is on its way back to the account you paid from. Banks usually show it in 5–7 working days.`,
  ]);
  return { done: `Refunded ${formatPrice(intent.amount)}. It reaches the customer in 5–7 working days.` };
}

/** The courier first, then the money, then the order itself, so a refund never goes out while a parcel is still on its way. */
async function cancelOrder(id: string, reason: string) {
  const o = await getOrder(id);
  cancellable(o);
  const done: string[] = [];
  if (activeShipment(o)) {
    try {
      await cancelBooking(id);
      done.push("Delhivery shipment cancelled.");
    } catch (e) {
      done.push(`⚠ Delhivery didn't cancel the shipment (${(e as Error).message}). Cancel it in the Delhivery panel.`);
    }
  }
  let back = 0;
  const m = await moneyOf(o);
  if (m.left > 0) {
    try {
      await sendBack(o, m.left, { reason: "Order cancelled", note: reason });
      back = m.left;
      done.push(`Refunded ${formatPrice(m.left)}; it reaches the customer in 5–7 working days.`);
    } catch (e) {
      done.push(`⚠ ${(e as Error).message} No money was sent back; refund it in the Razorpay dashboard.`);
    }
  } else {
    done.push("Nothing was paid online, so there was nothing to refund.");
  }
  const after = await getOrder(id);
  // Nothing more for the courier to collect on a cancelled order.
  const paymentStatus = after?.payment.status === "cod_due" ? "void" : undefined;
  await adminUpdateOrder(id, { status: "cancelled", statusNote: reason, note: done.join(" "), paymentStatus });
  await tellCustomer(o, `Your TATTV order ${o.id} has been cancelled`, [
    reason,
    "",
    back > 0
      ? `We've refunded ${formatPrice(back)} to the account you paid from. Banks usually show it in 5–7 working days.`
      : "Nothing was charged online for this order, so there is nothing to refund.",
  ]);
  return { done: `Order cancelled. ${done.join(" ")}` };
}

async function tellCustomer(o: Order, subject: string, lines: string[]) {
  await sendMail({
    to: o.customer.email,
    replyTo: await storeInbox(),
    subject,
    text: [`Hi ${o.customer.firstName},`, "", ...lines, "", `Questions? Call or WhatsApp us on ${CONTACT.phoneDisplay}, or just reply to this email.`, "", "TATTV"].join("\n"),
  }).catch((e) => console.error("[MONEY] customer email failed", (e as Error).message));
}

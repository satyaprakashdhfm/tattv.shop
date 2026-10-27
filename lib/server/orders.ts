import "server-only";
import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { COUPONS, GIFT_WRAP, ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/site";
import { OrderError, normalisePhone, priceOrder, validateCustomer, type CustomerInput, type OrderItemInput, type PricedLine } from "@/lib/pricing";
import { type Db, pool, query, transaction } from "./db";
import { sendMail, storeInbox } from "./mail";
import { invalidateCatalog, loadCatalogData } from "./catalog";
import { createRazorpayOrder, razorpayEnabled, razorpayKeyId, verifyPaymentSignature, type RazorpayResponse } from "./razorpay";

export { OrderError };

const isProd = process.env.NODE_ENV === "production";

export type PaymentMethod = "cod" | "razorpay" | "demo";

export interface Order {
  id: string;
  token: string;
  createdAt: string;
  status: OrderStatus;
  customer: CustomerInput;
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  discountCode: string | null;
  shipping: number;
  /** Gift packing: the fee charged (0 = not a gift), with the card's occasion and message. */
  gift: { fee: number; occasion: string; message: string } | null;
  total: number;
  payment: { method: PaymentMethod; status: PaymentStatus; razorpayOrderId: string | null; paymentId: string | null; paidAt: string | null };
  tracking: { courier: string; number: string; url: string } | null;
  history: { at: string; status: OrderStatus; note: string; byAdmin: boolean }[];
  notes: { at: string; text: string }[];
  stockApplied: boolean;
}

/** What the checkout can offer right now. */
export function paymentConfig() {
  const demo = !razorpayEnabled() && (!isProd || process.env.DEMO_PAYMENTS === "true");
  return {
    online: (razorpayEnabled() ? "razorpay" : demo ? "demo" : null) as "razorpay" | "demo" | null,
    keyId: razorpayKeyId(),
    cod: process.env.COD_ENABLED !== "false",
  };
}

// ── Reading orders ──
const ORDER_SELECT = `
  SELECT o.*,
    COALESCE((SELECT json_agg(json_build_object('slug', i.product_slug, 'name', i.name, 'size', i.size, 'price', i.price, 'qty', i.qty, 'image', i.image) ORDER BY i.line_no)
              FROM order_items i WHERE i.order_id = o.id), '[]') AS lines,
    COALESCE((SELECT json_agg(json_build_object('at', e.at, 'status', e.status, 'note', e.note, 'byAdmin', e.by_admin) ORDER BY e.at, e.id)
              FROM order_events e WHERE e.order_id = o.id), '[]') AS history,
    COALESCE((SELECT json_agg(json_build_object('at', n.at, 'text', n.text) ORDER BY n.at, n.id)
              FROM order_notes n WHERE n.order_id = o.id), '[]') AS notes
  FROM orders o`;

/* eslint-disable @typescript-eslint/no-explicit-any -- raw rows from the query above */
const toOrder = (r: any): Order => ({
  id: r.id,
  token: r.token,
  createdAt: new Date(r.created_at).toISOString(),
  status: r.status,
  customer: { email: r.email, phone: r.phone, firstName: r.first_name, lastName: r.last_name, address: r.address, apartment: r.apartment, city: r.city, state: r.state, pin: r.pin },
  lines: r.lines,
  subtotal: r.subtotal,
  discount: r.discount,
  discountCode: r.discount_code,
  shipping: r.shipping,
  gift: r.gift_wrap > 0 || r.gift_message ? { fee: r.gift_wrap, occasion: r.gift_occasion ?? "", message: r.gift_message ?? "" } : null,
  total: r.total,
  payment: {
    method: r.payment_method,
    status: r.payment_status,
    razorpayOrderId: r.razorpay_order_id,
    paymentId: r.payment_id,
    paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : null,
  },
  tracking: r.tracking_courier || r.tracking_number ? { courier: r.tracking_courier ?? "", number: r.tracking_number ?? "", url: r.tracking_url ?? "" } : null,
  history: r.history,
  notes: r.notes,
  stockApplied: r.stock_applied,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

async function loadOrder(db: Db, id: string, lock = false): Promise<Order | null> {
  if (lock) await db.query("SELECT 1 FROM orders WHERE id = $1 FOR UPDATE", [id]);
  const r = await db.query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
  return r.rows[0] ? toOrder(r.rows[0]) : null;
}

export const isLive = (o: Pick<Order, "status">) => o.status !== "pending_payment" && o.status !== "cancelled";

/** Strip admin-only fields before an order goes to the browser. */
export function publicOrder(o: Order) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notes, token, stockApplied, ...rest } = o;
  return { ...rest, history: o.history.map(({ at, status, note }) => ({ at, status, note })) };
}
export type PublicOrder = ReturnType<typeof publicOrder>;

// ── Stock ──
async function adjustStock(db: PoolClient, lines: PricedLine[], sign: 1 | -1) {
  for (const l of lines) {
    await db.query("UPDATE products SET stock = GREATEST(0, stock + $2) WHERE slug = $1 AND stock IS NOT NULL", [l.slug, sign * l.qty]);
  }
  invalidateCatalog();
}

async function addEvent(db: PoolClient, id: string, status: OrderStatus, note: string, byAdmin = false) {
  await db.query("INSERT INTO order_events (order_id, status, note, by_admin) VALUES ($1, $2, $3, $4)", [id, status, note, byAdmin]);
}

async function confirm(db: PoolClient, o: Order, note: string) {
  await db.query("UPDATE orders SET status = 'confirmed' WHERE id = $1", [o.id]);
  await addEvent(db, o.id, "confirmed", note);
  if (!o.stockApplied) {
    await adjustStock(db, o.lines, -1);
    await db.query("UPDATE orders SET stock_applied = true WHERE id = $1", [o.id]);
  }
}

// ── Checkout ──
export async function createOrder(input: {
  customer?: unknown;
  items?: OrderItemInput[];
  discountCode?: string | null;
  paymentMethod?: string;
  gift?: { wrap?: unknown; occasion?: unknown; message?: unknown } | null;
}) {
  const customer = validateCustomer(input.customer);
  const giftWrap = input.gift?.wrap === true;
  const giftOccasion = giftWrap && GIFT_WRAP.occasions.includes(String(input.gift?.occasion)) ? String(input.gift?.occasion) : "";
  const giftMessage = giftWrap ? String(input.gift?.message ?? "").trim().slice(0, GIFT_WRAP.messageMax) : "";
  const cfg = paymentConfig();
  const method = input.paymentMethod;
  if (method === "cod" ? !cfg.cod : method !== "online" || !cfg.online) throw new OrderError("That payment method is not available.");
  const items = Array.isArray(input.items) ? input.items : [];

  const { products } = await loadCatalogData();
  const bySlug = new Map(products.filter((p) => p.active !== false).map((p) => [p.slug, p]));

  const order = await transaction(async (db) => {
    // Lock the rows being bought, so two checkouts can't both take the last piece.
    const slugs = [...new Set(items.map((i) => String(i?.slug)))];
    const stock = await db.query<{ slug: string; stock: number | null; active: boolean }>(
      "SELECT slug, stock, active FROM products WHERE slug = ANY($1) ORDER BY slug FOR UPDATE",
      [slugs],
    );
    const live = new Map(stock.rows.filter((r) => r.active).map((r) => [r.slug, r.stock]));
    const getProduct = (slug: string) => {
      const p = bySlug.get(slug);
      return p && live.has(slug) ? { ...p, stock: live.get(slug) ?? null } : undefined;
    };
    const prior = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM orders WHERE status NOT IN ('pending_payment', 'cancelled') AND (email = $1 OR phone = $2)",
      [customer.email, customer.phone],
    );
    const priced = priceOrder({ items, getProduct, coupons: COUPONS, couponCode: input.discountCode, priorOrders: prior.rows[0].n, giftWrap });

    const seq = await db.query<{ n: string }>("SELECT nextval('order_number_seq') AS n");
    const id = `TTV-${seq.rows[0].n}`;
    const token = crypto.randomBytes(16).toString("hex");
    const pay: PaymentMethod = method === "cod" ? "cod" : cfg.online!;
    const c = customer;
    await db.query(
      `INSERT INTO orders (id, token, status, email, phone, first_name, last_name, address, apartment, city, state, pin,
         subtotal, discount, discount_code, shipping, total, payment_method, payment_status, gift_wrap, gift_occasion, gift_message)
       VALUES ($1,$2,'pending_payment',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [id, token, c.email, c.phone, c.firstName, c.lastName, c.address, c.apartment, c.city, c.state, c.pin,
        priced.subtotal, priced.discount, priced.discountCode, priced.shipping, priced.total, pay, pay === "cod" ? "cod_due" : "pending",
        priced.giftWrap, giftOccasion, giftMessage],
    );
    for (const [n, l] of priced.lines.entries()) {
      await db.query("INSERT INTO order_items (order_id, line_no, product_slug, name, size, price, qty, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [
        id, n, l.slug, l.name, l.size, l.price, l.qty, l.image,
      ]);
    }
    await addEvent(db, id, "pending_payment", "Order created");
    const o = (await loadOrder(db, id))!;
    if (pay === "cod") await confirm(db, o, "Cash on delivery order placed");
    return (await loadOrder(db, id))!;
  });

  if (order.payment.method === "razorpay") {
    const rzp = await createRazorpayOrder({ amount: order.total, receipt: order.id, notes: { order: order.id } });
    await query("UPDATE orders SET razorpay_order_id = $2 WHERE id = $1", [order.id, rzp.id]);
    return { order, payment: { mode: "razorpay" as const, keyId: razorpayKeyId(), razorpayOrderId: rzp.id } };
  }
  return { order, payment: { mode: order.payment.method } };
}

/**
 * Called by the browser after the payment window succeeds, or by the Razorpay webhook
 * (`viaWebhook`: the webhook signature was already checked by the caller).
 */
export async function completePayment(id: string, token: string | null, resp: RazorpayResponse, { viaWebhook = false } = {}) {
  return transaction(async (db) => {
    const o = await loadOrder(db, id, true);
    if (!o || (!viaWebhook && o.token !== token)) throw new OrderError("Order not found", 404);
    if (o.payment.status === "paid") return o;
    let paymentId: string;
    if (o.payment.method === "razorpay") {
      const sameOrder = resp.razorpay_order_id === o.payment.razorpayOrderId;
      if (!sameOrder || (!viaWebhook && !verifyPaymentSignature(resp))) {
        throw new OrderError("Payment could not be verified. If money was deducted, contact us with your order number.");
      }
      paymentId = resp.razorpay_payment_id!;
    } else if (o.payment.method === "demo") {
      if (paymentConfig().online !== "demo") throw new OrderError("Demo payments are switched off.");
      paymentId = "demo_" + crypto.randomBytes(6).toString("hex");
    } else {
      throw new OrderError("This order is not paid online.");
    }
    await db.query("UPDATE orders SET payment_status = 'paid', payment_id = $2, paid_at = now() WHERE id = $1", [id, paymentId]);
    if (o.status === "pending_payment") await confirm(db, o, "Payment received");
    return (await loadOrder(db, id))!;
  });
}

export async function failPayment(id: string, token: string, reason?: string) {
  return transaction(async (db) => {
    const o = await loadOrder(db, id, true);
    if (!o || o.token !== token) throw new OrderError("Order not found", 404);
    if (o.payment.status !== "pending") return o;
    await db.query("UPDATE orders SET payment_status = 'failed' WHERE id = $1", [id]);
    await addEvent(db, id, o.status, "Payment failed" + (reason ? `: ${String(reason).slice(0, 120)}` : ""));
    return (await loadOrder(db, id))!;
  });
}

export async function findByRazorpayOrder(rzpOrderId: string) {
  const r = await query<{ id: string }>("SELECT id FROM orders WHERE razorpay_order_id = $1", [rzpOrderId]);
  return r.rows[0]?.id ?? null;
}

// ── Customer access ──
export async function getOrderFor(id: string, token: string | null) {
  const o = await loadOrder(await pool(), id);
  return o && token && token === o.token ? o : null;
}

/**
 * Orders for My Account: the ones this browser placed (each proven by its token) plus, for the
 * preview account, every order under its email. Unpaid checkouts are left out.
 */
export async function accountOrders(refs: unknown, email: string | null) {
  const db = await pool();
  const found = new Map<string, Order>();
  for (const r of (Array.isArray(refs) ? refs : []).slice(0, 30)) {
    const o = await getOrderFor(String(r?.id ?? ""), r?.token ? String(r.token) : null);
    if (o) found.set(o.id, o);
  }
  if (email) {
    const r = await db.query(`${ORDER_SELECT} WHERE o.email = $1 ORDER BY o.created_at DESC LIMIT 30`, [email]);
    for (const row of r.rows) found.set(row.id, toOrder(row));
  }
  return [...found.values()].filter((o) => o.status !== "pending_payment").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Guests find an order with its number plus the email or phone used at checkout. */
export async function lookupOrder(id: string, contact: string) {
  const o = await loadOrder(await pool(), String(id).trim().toUpperCase());
  if (!o) return null;
  const c = String(contact || "").trim().toLowerCase();
  return c && (o.customer.email === c || o.customer.phone === normalisePhone(c)) ? o : null;
}

// ── Admin ──
export async function listOrders() {
  const r = await query(`${ORDER_SELECT} ORDER BY o.created_at DESC`);
  return r.rows.map(toOrder);
}

export async function getOrder(id: string) {
  return loadOrder(await pool(), id);
}

export async function adminUpdateOrder(
  id: string,
  change: { status?: string; statusNote?: unknown; tracking?: { courier?: unknown; number?: unknown; url?: unknown }; note?: string; paymentStatus?: string },
) {
  return transaction(async (db) => {
    const o = await loadOrder(db, id, true);
    if (!o) throw new OrderError("Order not found", 404);

    if (change.tracking) {
      const t = change.tracking;
      const courier = String(t.courier || "").slice(0, 60);
      const number = String(t.number || "").slice(0, 80);
      const url = /^https?:\/\//i.test(String(t.url || "")) ? String(t.url).slice(0, 300) : "";
      const empty = !courier && !number;
      await db.query("UPDATE orders SET tracking_courier = $2, tracking_number = $3, tracking_url = $4 WHERE id = $1", [
        id, empty ? null : courier, empty ? null : number, empty ? null : url,
      ]);
    }
    if (change.note) await db.query("INSERT INTO order_notes (order_id, text) VALUES ($1, $2)", [id, String(change.note).slice(0, 1000)]);
    if (change.paymentStatus && change.paymentStatus !== o.payment.status) {
      if (!["paid", "refunded"].includes(change.paymentStatus)) throw new OrderError("Unknown payment status");
      await db.query("UPDATE orders SET payment_status = $2, paid_at = COALESCE(paid_at, CASE WHEN $2 = 'paid' THEN now() END) WHERE id = $1", [id, change.paymentStatus]);
      await addEvent(db, id, o.status, "Payment marked " + change.paymentStatus, true);
    }

    const next = change.status as OrderStatus | undefined;
    if (next && next !== o.status) {
      if (!(next in ORDER_STATUSES)) throw new OrderError("Unknown status");
      if (next === "cancelled" && o.stockApplied) {
        await adjustStock(db, o.lines, 1);
        await db.query("UPDATE orders SET stock_applied = false WHERE id = $1", [id]);
      }
      if (next !== "cancelled" && next !== "pending_payment" && !o.stockApplied) {
        await adjustStock(db, o.lines, -1);
        await db.query("UPDATE orders SET stock_applied = true WHERE id = $1", [id]);
      }
      await db.query("UPDATE orders SET status = $2 WHERE id = $1", [id, next]);
      await addEvent(db, id, next, change.statusNote ? String(change.statusNote).slice(0, 300) : "", true);
    }
    return (await loadOrder(db, id))!;
  });
}

export interface CustomerSummary {
  email: string;
  name: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  first: string;
  last: string;
}

export function customersFrom(orders: Order[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const o of orders.filter(isLive)) {
    const key = o.customer.email;
    const c = map.get(key) || { email: key, name: "", phone: "", city: "", orders: 0, spent: 0, last: o.createdAt, first: o.createdAt };
    c.name ||= `${o.customer.firstName} ${o.customer.lastName}`.trim();
    c.phone ||= o.customer.phone;
    c.city ||= `${o.customer.city}, ${o.customer.state}`;
    c.orders += 1;
    c.spent += o.total;
    if (o.createdAt > c.last) c.last = o.createdAt;
    if (o.createdAt < c.first) c.first = o.createdAt;
    map.set(key, c);
  }
  return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
}

// ── Messages (contact form and return requests) ──
export interface Message {
  id: string;
  createdAt: string;
  kind: "contact" | "return";
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  status: "new" | "read" | "archived";
}

export async function createMessage(input: Record<string, unknown>) {
  const m = {
    id: "msg_" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex"),
    kind: input.kind === "return" ? "return" : "contact",
    name: String(input.name || "").trim().slice(0, 120),
    email: String(input.email || "").trim().toLowerCase().slice(0, 200),
    phone: String(input.phone || "").trim().slice(0, 30),
    subject: String(input.subject || "").trim().slice(0, 200),
    body: String(input.body || "").trim().slice(0, 4000),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) throw new OrderError("Please enter a valid email.");
  if (!m.body) throw new OrderError("Please write a message.");
  await query("INSERT INTO messages (id, kind, name, email, phone, subject, body) VALUES ($1,$2,$3,$4,$5,$6,$7)", [
    m.id, m.kind, m.name, m.email, m.phone, m.subject, m.body,
  ]);
  // Also emailed to the store, so the team can reply straight from their inbox. Saved first, so a mail problem never loses a message.
  await sendMail({
    to: await storeInbox(),
    replyTo: m.email,
    subject: `${m.kind === "return" ? "Return request" : "New message"}: ${m.subject || "(no subject)"}`,
    text: [`From: ${m.name || "(no name)"} <${m.email}>${m.phone ? ` · ${m.phone}` : ""}`, "", m.body].join("\n"),
  }).catch((e) => console.error("Could not email the message", e));
}

export async function listMessages(): Promise<Message[]> {
  const r = await query("SELECT * FROM messages ORDER BY created_at DESC");
  return r.rows.map((m) => ({ ...m, createdAt: new Date(m.created_at).toISOString() }) as Message);
}

export async function setMessageStatus(id: string, status: string) {
  if (!["new", "read", "archived"].includes(status)) throw new OrderError("Unknown status");
  await query("UPDATE messages SET status = $2 WHERE id = $1", [id, status]);
}

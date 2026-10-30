import "server-only";
import { OrderError, normalisePhone } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { offerName, type Offer } from "@/lib/site";
import { type Db, query, transaction } from "./db";

// Discount codes, made in Admin → Coupons. A code is a % or a flat ₹ amount off the bag, with optional rules:
//   active          switched off, it stops working at once (orders that used it keep their discount)
//   showAtCheckout  listed under "Offers & Coupons" at checkout; untick for a code you share yourself
//   firstOrderOnly  only for an email / mobile that has never ordered
//   minSubtotal     the bag must come to at least this (₹)
//   maxUses         orders in all that may use it (0 = no limit)
//   perCustomer     orders one customer may use it on (0 = no limit)
//   startsAt / expiresAt  the days it works (India time; either may be empty)
//   ownerEmail / ownerPhone  linked to one customer: only an order with that email or mobile can use it
// Times used are counted from the orders themselves, so they can't drift: an order that isn't cancelled
// counts, and an online checkout waiting for payment holds its place for an hour.

export interface Coupon {
  code: string;
  kind: "percent" | "flat";
  value: number;
  label: string;
  active: boolean;
  showAtCheckout: boolean;
  firstOrderOnly: boolean;
  minSubtotal: number;
  maxUses: number;
  perCustomer: number;
  startsAt: string | null;
  expiresAt: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  note: string;
  createdAt: string;
}

export type CouponState = "on" | "off" | "scheduled" | "ended" | "used up";

export interface CouponUse {
  id: string;
  at: string;
  name: string;
  email: string;
  phone: string;
  total: number;
  discount: number;
  status: string;
}

export interface CouponWithUse extends Coupon {
  used: number;
  /** Discount given on orders that went through. */
  given: number;
  /** Sales (order totals) that came with the code. */
  sales: number;
  state: CouponState;
}

/** An order that counts as a use of its code. */
const IS_USE = `o.status <> 'cancelled' AND (o.status <> 'pending_payment' OR (o.payment_status = 'pending' AND o.created_at > now() - interval '1 hour'))`;
const CODE_RE = /^[A-Z0-9]{3,20}$/;

/* eslint-disable @typescript-eslint/no-explicit-any -- raw rows */
const toCoupon = (r: any): Coupon => ({
  code: r.code,
  kind: r.kind,
  value: r.value,
  label: r.label,
  active: r.active,
  showAtCheckout: r.show_at_checkout,
  firstOrderOnly: r.first_order_only,
  minSubtotal: r.min_subtotal,
  maxUses: r.max_uses,
  perCustomer: r.per_customer,
  startsAt: r.starts_at ? new Date(r.starts_at).toISOString() : null,
  expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
  ownerEmail: r.owner_email,
  ownerPhone: r.owner_phone,
  note: r.note,
  createdAt: new Date(r.created_at).toISOString(),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export function couponState(c: Coupon & { used: number }, now = Date.now()): CouponState {
  if (!c.active) return "off";
  if (c.startsAt && Date.parse(c.startsAt) > now) return "scheduled";
  if (c.expiresAt && Date.parse(c.expiresAt) < now) return "ended";
  if (c.maxUses && c.used >= c.maxUses) return "used up";
  return "on";
}

const toOffer = (c: Coupon): Offer => ({
  code: c.code,
  kind: c.kind,
  value: c.value,
  label: c.label,
  minSubtotal: c.minSubtotal,
  ...(c.firstOrderOnly ? { firstOrderOnly: true } : {}),
  ...(c.ownerEmail || c.ownerPhone ? { personal: true } : {}),
});

const USAGE = `
  SELECT c.*,
    (SELECT count(*)::int FROM orders o WHERE o.discount_code = c.code AND ${IS_USE}) AS used,
    (SELECT COALESCE(sum(o.discount), 0)::int FROM orders o WHERE o.discount_code = c.code AND o.status NOT IN ('pending_payment', 'cancelled')) AS given,
    (SELECT COALESCE(sum(o.total), 0)::int FROM orders o WHERE o.discount_code = c.code AND o.status NOT IN ('pending_payment', 'cancelled')) AS sales
  FROM coupons c`;

const withUse = (r: { used: number; given: number; sales: number }) => {
  const c = { ...toCoupon(r), used: r.used, given: r.given, sales: r.sales };
  return { ...c, state: couponState(c) };
};

/** Admin → Coupons: every code with how often it was used, newest first. */
export async function listCoupons(): Promise<CouponWithUse[]> {
  const r = await query(`${USAGE} ORDER BY c.created_at DESC`);
  return r.rows.map((x) => withUse(x as never));
}

export async function getCoupon(code: string): Promise<CouponWithUse | null> {
  const r = await query(`${USAGE} WHERE c.code = $1`, [String(code || "").toUpperCase()]);
  return r.rows[0] ? withUse(r.rows[0] as never) : null;
}

/** The orders that used a code (cancelled ones too, marked), newest first. */
export async function couponOrders(code: string): Promise<CouponUse[]> {
  const r = await query(
    `SELECT id, created_at, first_name, last_name, email, phone, total, discount, status FROM orders
     WHERE discount_code = $1 AND status <> 'pending_payment' ORDER BY created_at DESC LIMIT 200`,
    [code],
  );
  return r.rows.map((o) => ({
    id: o.id,
    at: new Date(o.created_at).toISOString(),
    name: `${o.first_name} ${o.last_name}`.trim(),
    email: o.email,
    phone: o.phone,
    total: o.total,
    discount: o.discount,
    status: o.status,
  }));
}

/** "2026-11-14" → that day's start or end in India time. */
const dayEdge = (d: string, end: boolean) => new Date(`${d}T${end ? "23:59:59" : "00:00:00"}+05:30`).toISOString();

export interface CouponInput {
  code: unknown;
  kind: unknown;
  value: unknown;
  label: unknown;
  active: boolean;
  showAtCheckout: boolean;
  firstOrderOnly: boolean;
  minSubtotal: unknown;
  maxUses: unknown;
  perCustomer: unknown;
  startsOn: unknown;
  expiresOn: unknown;
  ownerEmail: unknown;
  ownerPhone: unknown;
  note: unknown;
}

export async function saveCoupon(input: CouponInput, { isNew }: { isNew: boolean }) {
  const code = String(input.code || "").trim().toUpperCase();
  if (!CODE_RE.test(code)) throw new OrderError("The code must be 3 to 20 letters or numbers, no spaces (like DIWALI15).");
  const kind = input.kind === "flat" ? "flat" : "percent";
  const value = Number(input.value);
  if (kind === "percent" && (!Number.isInteger(value) || value < 1 || value > 90)) throw new OrderError("The discount must be a whole number from 1 to 90 (%).");
  if (kind === "flat" && (!Number.isInteger(value) || value < 1 || value > 100_000)) throw new OrderError("The discount must be a whole number of rupees above 0.");
  const int = (v: unknown, label: string, max: number) => {
    if (v === "" || v == null) return 0;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > max) throw new OrderError(`${label} must be a whole number from 0 to ${max.toLocaleString("en-IN")}.`);
    return n;
  };
  const minSubtotal = int(input.minSubtotal, "The minimum order", 1_000_000);
  const maxUses = int(input.maxUses, "Total uses", 1_000_000);
  const perCustomer = int(input.perCustomer, "Uses per customer", 1000);
  const day = (v: unknown, label: string) => {
    const s = String(v || "").trim();
    if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new OrderError(`Pick a valid ${label}, or leave it empty.`);
    return s;
  };
  const starts = day(input.startsOn, "first day");
  const expires = day(input.expiresOn, "last day");
  if (starts && expires && starts > expires) throw new OrderError("The last day is before the first day.");
  const ownerEmail = String(input.ownerEmail || "").trim().toLowerCase() || null;
  if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) throw new OrderError("The customer's email doesn't look right.");
  const phoneRaw = String(input.ownerPhone || "").trim();
  const ownerPhone = phoneRaw ? normalisePhone(phoneRaw) : null;
  if (ownerPhone && !/^[6-9]\d{9}$/.test(ownerPhone)) throw new OrderError("The customer's mobile doesn't look right. Use their 10-digit number, or leave it empty.");
  if (kind === "flat" && minSubtotal && value >= minSubtotal) throw new OrderError("A flat discount must be less than the minimum order.");
  const name = offerName({ kind, value });
  const label =
    String(input.label || "").trim().slice(0, 80) ||
    (input.firstOrderOnly ? `${name} your first order` : minSubtotal ? `${name} orders above ${formatPrice(minSubtotal)}` : `${name} your order`);

  await transaction(async (db) => {
    const before = await db.query("SELECT 1 FROM coupons WHERE code = $1 FOR UPDATE", [code]);
    if (isNew && before.rowCount) throw new OrderError(`${code} already exists. Pick another code, or edit that one.`);
    if (!isNew && !before.rowCount) throw new OrderError("This coupon no longer exists.", 404);
    const values = [
      code, kind, value, label, !!input.active, !!input.showAtCheckout, !!input.firstOrderOnly, minSubtotal, maxUses, perCustomer,
      starts ? dayEdge(starts, false) : null, expires ? dayEdge(expires, true) : null, ownerEmail, ownerPhone, String(input.note || "").trim().slice(0, 300),
    ];
    if (isNew) {
      await db.query(
        `INSERT INTO coupons (code, kind, value, label, active, show_at_checkout, first_order_only, min_subtotal, max_uses, per_customer, starts_at, expires_at, owner_email, owner_phone, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        values,
      );
    } else {
      await db.query(
        `UPDATE coupons SET kind=$2, value=$3, label=$4, active=$5, show_at_checkout=$6, first_order_only=$7, min_subtotal=$8, max_uses=$9,
           per_customer=$10, starts_at=$11, expires_at=$12, owner_email=$13, owner_phone=$14, note=$15, updated_at=now() WHERE code=$1`,
        values,
      );
    }
  });
  return code;
}

export async function setCouponActive(code: string, active: boolean) {
  await query("UPDATE coupons SET active = $2, updated_at = now() WHERE code = $1", [code, active]);
}

/** Orders that used it keep the code and the discount they got. */
export async function deleteCoupon(code: string) {
  await query("DELETE FROM coupons WHERE code = $1", [code]);
}

export interface Shopper {
  email?: string | null;
  phone?: string | null;
}

const who = (s: Shopper) => ({ email: String(s.email || "").trim().toLowerCase() || null, phone: normalisePhone(s.phone || "") || null });
const isOwner = (c: Coupon, s: ReturnType<typeof who>) => (!!c.ownerEmail && c.ownerEmail === s.email) || (!!c.ownerPhone && c.ownerPhone === s.phone);
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long" });

/**
 * Checks a typed code for this customer and returns it, or throws with the reason it can't be used.
 * Inside an order transaction (`lock`), the coupon row is locked so two checkouts can't both take the last use.
 * The bag minimum is checked when the order is priced (lib/pricing.ts), since "Apply" doesn't send the bag.
 */
export async function checkCoupon(db: Db, rawCode: unknown, shopper: Shopper, { lock = false } = {}): Promise<Offer> {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) throw new OrderError("Enter a discount code.");
  const r = await db.query(`SELECT * FROM coupons WHERE code = $1${lock ? " FOR UPDATE" : ""}`, [code]);
  if (!r.rowCount) throw new OrderError("That discount code is not valid.");
  const c = toCoupon(r.rows[0]);
  const now = Date.now();
  if (!c.active) throw new OrderError(`${code} is not active right now.`);
  if (c.startsAt && Date.parse(c.startsAt) > now) throw new OrderError(`${code} starts on ${day(c.startsAt)}.`);
  if (c.expiresAt && Date.parse(c.expiresAt) < now) throw new OrderError(`${code} has ended.`);

  const s = who(shopper);
  const personal = !!(c.ownerEmail || c.ownerPhone);
  if (personal && !s.email && !s.phone) throw new OrderError(`${code} is a personal coupon. Enter your email and mobile number first, then apply it.`);
  if (personal && !isOwner(c, s)) throw new OrderError(`${code} belongs to another customer. Use the email or mobile number it was given to.`);

  const uses = await db.query<{ total: number; mine: number }>(
    `SELECT count(*)::int AS total, count(*) FILTER (WHERE o.email = $2 OR o.phone = $3)::int AS mine FROM orders o WHERE o.discount_code = $1 AND ${IS_USE}`,
    [code, s.email, s.phone],
  );
  const { total, mine } = uses.rows[0];
  if (c.maxUses && total >= c.maxUses) throw new OrderError(`${code} has been used up.`);
  if (c.perCustomer && mine >= c.perCustomer) throw new OrderError(c.perCustomer === 1 ? `You have already used ${code}.` : `You have used ${code} ${c.perCustomer} times already.`);
  if (c.firstOrderOnly && (s.email || s.phone)) {
    const prior = await db.query("SELECT 1 FROM orders WHERE status NOT IN ('pending_payment', 'cancelled') AND (email = $1 OR phone = $2) LIMIT 1", [s.email, s.phone]);
    if (prior.rowCount) throw new OrderError(`${code} is only for your first order.`);
  }
  return toOffer(c);
}

/** "Offers & Coupons" at checkout: codes anyone may use right now. Personal codes are never listed. */
export async function publicOffers(): Promise<Offer[]> {
  return (await listCoupons())
    .filter((c) => c.state === "on" && c.showAtCheckout && !c.ownerEmail && !c.ownerPhone)
    .sort((a, b) => a.minSubtotal - b.minSubtotal)
    .map(toOffer);
}

/** Codes linked to a customer (by email or mobile), for the admin customer list and the customer's account. */
export async function couponsOwnedBy(shopper: Shopper): Promise<CouponWithUse[]> {
  const s = who(shopper);
  if (!s.email && !s.phone) return [];
  return (await listCoupons()).filter((c) => isOwner(c, s));
}

// Order pricing and validation. Pure functions, shared by the browser (instant feedback) and the
// server (enforced). The browser never decides prices: the server re-prices every order with this.
import type { Product } from "./products";
import { shippingFor, type ShippingRules } from "./format";
import { MAX_QTY_PER_ITEM, discountFor, type Offer } from "./site";

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface OrderItemInput {
  slug: string;
  size?: string | null;
  qty: number;
}

export interface PricedLine {
  slug: string;
  name: string;
  size: string | null;
  price: number;
  qty: number;
  image: string;
}

export interface PricedOrder {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  discountCode: string | null;
  shipping: number;
  /** Gift packing charge; 0 when not asked for. */
  giftWrap: number;
  total: number;
}

export function priceOrder({
  items,
  getProduct,
  coupon = null,
  giftWrap = false,
  rules,
}: {
  items: OrderItemInput[];
  /** Active products only; `stock` null means not tracked. */
  getProduct: (slug: string) => Product | undefined;
  /** A code the server has already checked for this customer (lib/server/coupons.ts); the bag minimum is checked here. */
  coupon?: Pick<Offer, "code" | "kind" | "value" | "minSubtotal"> | null;
  giftWrap?: boolean;
  /** The stored rules (Site Settings): shipping and the gift packing fee. */
  rules: ShippingRules & { giftWrapFee: number };
}): PricedOrder {
  if (!Array.isArray(items) || items.length === 0) throw new OrderError("Your bag is empty.");
  if (items.length > 50) throw new OrderError("Too many items in one order.");

  // Same piece in the same size is one line; stock is counted per piece across sizes.
  const merged = new Map<string, OrderItemInput>();
  const perProduct = new Map<string, number>();
  for (const it of items) {
    const qty = Number(it?.qty);
    if (!Number.isInteger(qty) || qty < 1) throw new OrderError("Invalid quantity.");
    const size = it.size ? String(it.size) : null;
    const key = `${it.slug}|${size ?? ""}`;
    const prev = merged.get(key);
    merged.set(key, { slug: String(it.slug), size, qty: (prev?.qty ?? 0) + qty });
    perProduct.set(it.slug, (perProduct.get(it.slug) ?? 0) + qty);
  }

  const lines: PricedLine[] = [];
  for (const { slug, size, qty } of merged.values()) {
    const p = getProduct(slug);
    if (!p) throw new OrderError("A piece in your bag is no longer available.");
    if (qty > MAX_QTY_PER_ITEM) throw new OrderError(`You can order up to ${MAX_QTY_PER_ITEM} of ${p.name}.`);
    if (p.sizes && (!size || !p.sizes.values.includes(size))) throw new OrderError(`Please choose a ${p.sizes.label.toLowerCase()} for ${p.name}.`);
    if (!p.sizes && size) throw new OrderError(`${p.name} doesn't come in sizes.`);
    const left = p.stock;
    const wanted = perProduct.get(slug) ?? qty;
    if (left != null && wanted > left) {
      throw new OrderError(left > 0 ? `Only ${left} of ${p.name} left in stock.` : `${p.name} is sold out.`, 409);
    }
    lines.push({ slug, name: p.name, size: size ?? null, price: p.price, qty, image: p.images[0] ?? "" });
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  let discount = 0;
  let discountCode: string | null = null;
  if (coupon) {
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) throw new OrderError(`${coupon.code} needs a bag of ₹${coupon.minSubtotal.toLocaleString("en-IN")} or more.`);
    discount = discountFor(coupon, subtotal);
    discountCode = coupon.code;
  }

  const shipping = shippingFor(subtotal, rules);
  const gift = giftWrap ? rules.giftWrapFee : 0;
  return { lines, subtotal, discount, discountCode, shipping, giftWrap: gift, total: subtotal - discount + shipping + gift };
}

export interface CustomerInput {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pin: string;
}

export const normalisePhone = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-10);

// Checkout form rules: an empty string means the field is fine.
export const CUSTOMER_RULES: Record<Exclude<keyof CustomerInput, "apartment">, (v: string) => string> = {
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email"),
  phone: (v) => (/^[6-9]\d{9}$/.test(normalisePhone(v)) ? "" : "Enter a valid 10-digit mobile number"),
  firstName: (v) => (v.trim() ? "" : "Enter your first name"),
  lastName: (v) => (v.trim() ? "" : "Enter your last name"),
  address: (v) => (v.trim().length >= 5 ? "" : "Enter your full address"),
  city: (v) => (v.trim() ? "" : "Enter a city"),
  state: (v) => (v.trim() ? "" : "Choose a state"),
  pin: (v) => (/^[1-9]\d{5}$/.test(v) ? "" : "Enter a valid 6-digit pincode"),
};

export function validateCustomer(input: unknown): CustomerInput {
  const src = (input ?? {}) as Record<string, unknown>;
  const fields: (keyof CustomerInput)[] = ["email", "phone", "firstName", "lastName", "address", "apartment", "city", "state", "pin"];
  const c = Object.fromEntries(fields.map((f) => [f, String(src[f] ?? "").trim().slice(0, 200)])) as unknown as CustomerInput;
  for (const [k, rule] of Object.entries(CUSTOMER_RULES)) {
    const err = rule(c[k as keyof CustomerInput]);
    if (err) throw new OrderError(err);
  }
  c.email = c.email.toLowerCase();
  c.phone = normalisePhone(c.phone);
  return c;
}

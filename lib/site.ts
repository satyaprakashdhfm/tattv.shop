// Store-wide settings. Safe to import from browser and server code: nothing secret lives here
// (secrets come from environment variables).

import { FREE_SHIPPING_THRESHOLD, formatPrice } from "./format";

// Starting contact details. The live values are edited in Admin → Site Settings (see StoreSettings);
// these are only the defaults for a new store. The address is still a placeholder: replace it in the admin.
export const CONTACT = {
  email: "contact@tattv.co.in",
  phoneDisplay: "+91 90306 11790",
  phone: "+919030611790",
  whatsapp: "919030611790",
  instagram: "https://www.instagram.com/tattv.shop/",
  instagramHandle: "@tattv.shop",
  youtube: "https://www.youtube.com/",
  hours: "Mon–Sat, 10am–7pm IST",
  address: ["TATTV Studio, Sample Street", "Hyderabad, Telangana 500001, India"],
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tattv.shop";

/**
 * Default site settings: social links for the ribbon and footer, and the contact details shown
 * across the store. The live values are edited in Admin → Site Settings.
 * Facebook and X are placeholders until TATTV's real pages are added there.
 */
export const DEFAULT_SETTINGS = {
  instagram: CONTACT.instagram,
  facebook: "https://www.facebook.com/",
  twitter: "https://x.com/",
  youtube: CONTACT.youtube,
  /** Messages rotating in the top ribbon, in order. An empty list hides the ribbon's messages. */
  announcements: [
    `Complimentary shipping across India on orders above ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
    "Easy 15-day returns & exchanges",
    "Every order arrives in a signature TATTV pouch",
  ],
  email: CONTACT.email,
  phone: CONTACT.phoneDisplay,
  hours: CONTACT.hours,
  address: CONTACT.address.join("\n"),
};

/** Digits for wa.me / tel: links; a 10-digit Indian number gets its 91 country code. */
export const phoneDigits = (v: string) => {
  const d = String(v || "").replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
};
export const telHref = (phone: string) => `tel:+${phoneDigits(phone)}`;

/** Return/exchange window in days, used in copy and the request form. */
export const RETURN_WINDOW_DAYS = 15;

export const MAX_QTY_PER_ITEM = 10;

// Discount codes are made in Admin → Coupons (lib/server/coupons.ts) and checked on the server when
// an order is placed. These sample codes are copied in once as the starting set; edit or delete them there.
export const SEED_COUPONS: Record<string, { percent: number; label: string; firstOrderOnly?: boolean; minSubtotal?: number }> = {
  WELCOME10: { percent: 10, firstOrderOnly: true, label: "10% off your first order" },
  TATTV15: { percent: 15, minSubtotal: 2999, label: "15% off orders above ₹2,999" },
  ELEMENT20: { percent: 20, minSubtotal: 4999, label: "20% off orders above ₹4,999" },
};

/** A discount code as checkout sees it. */
export interface Offer {
  code: string;
  /** "percent": `value` % off the bag; "flat": `value` rupees off. */
  kind: "percent" | "flat";
  value: number;
  label: string;
  /** Bag subtotal (₹) the code needs; 0 for none. */
  minSubtotal: number;
  firstOrderOnly?: boolean;
  /** Linked to this customer only. */
  personal?: boolean;
}

/** "15% off" / "₹200 off". */
export const offerName = (o: Pick<Offer, "kind" | "value">) => (o.kind === "percent" ? `${o.value}% off` : `${formatPrice(o.value)} off`);

/** The discount a code gives on this bag (never more than the bag). */
export const discountFor = (o: Pick<Offer, "kind" | "value">, subtotal: number) =>
  Math.min(subtotal, o.kind === "percent" ? Math.round((subtotal * o.value) / 100) : o.value);

/** Why a code can't be used on this bag yet, or "" if it can (the other rules are checked at the server). */
export function offerBlocker(o: Offer, subtotal: number): string {
  if (o.minSubtotal && subtotal < o.minSubtotal) return `Add ${formatPrice(o.minSubtotal - subtotal)} more to use ${o.code}`;
  return "";
}

/** Gift packing: the whole order goes in a TATTV gift box with a handwritten message card. */
export const GIFT_WRAP = { fee: 99, messageMax: 200, occasions: ["Birthday", "Anniversary", "Wedding", "Thank you", "Just because"] };

// Orders move through these stages. Labels are what the admin and the customer see.
export const ORDER_STATUSES = {
  pending_payment: { label: "Awaiting payment", customer: "Awaiting payment" },
  confirmed: { label: "New – to pack", customer: "Order placed" },
  packed: { label: "Packed", customer: "Packed" },
  shipped: { label: "Shipped", customer: "Shipped" },
  out_for_delivery: { label: "Out for delivery", customer: "Out for delivery" },
  delivered: { label: "Delivered", customer: "Delivered" },
  cancelled: { label: "Cancelled", customer: "Cancelled" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

/** The customer-facing progress tracker. */
export const TRACKER_STEPS: OrderStatus[] = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

export const PAYMENT_LABELS = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cod_due: "Cash on delivery (due)",
  refunded: "Refunded",
} as const;

export type PaymentStatus = keyof typeof PAYMENT_LABELS;

/** A WhatsApp chat with the store (number from Site Settings), with a message typed in. */
export const whatsappLink = (text: string, number: string = CONTACT.whatsapp) => `https://wa.me/${phoneDigits(number)}?text=${encodeURIComponent(text)}`;

/** The general "talk to us" WhatsApp link: the floating button, footer, contact and help pages. */
export const whatsappHello = (number: string) => whatsappLink("Hi TATTV! I’d love to know more about your products", number);

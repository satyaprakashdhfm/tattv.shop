// Store-wide settings. Safe to import from browser and server code: nothing secret lives here
// (secrets come from environment variables).

// Contact details. Placeholders: replace with TATTV's real numbers.
export const CONTACT = {
  email: "care@tattv.shop",
  phoneDisplay: "+91 00000 00000",
  phone: "+910000000000",
  whatsapp: "910000000000",
  instagram: "https://www.instagram.com/tattv.shop/",
  instagramHandle: "@tattv.shop",
  youtube: "https://www.youtube.com/",
  hours: "Mon–Sat, 10am–7pm IST",
  address: ["TATTV Studio, Sample Street", "Hyderabad, Telangana 500001, India"],
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tattv.shop";

/**
 * Default social links for the ribbon and footer. The live values are edited in Admin → Settings.
 * Facebook and X are placeholders until TATTV's real pages are added there.
 */
export const DEFAULT_SOCIAL = {
  instagram: CONTACT.instagram,
  facebook: "https://www.facebook.com/",
  twitter: "https://x.com/",
};

/** Return/exchange window in days, used in copy and the request form. */
export const RETURN_WINDOW_DAYS = 15;

export const MAX_QTY_PER_ITEM = 10;

export interface Coupon {
  percent: number;
  firstOrderOnly?: boolean;
  /** Bag subtotal (₹) the code needs. */
  minSubtotal?: number;
  label: string;
}

// Discount codes, checked on the server when an order is placed. `firstOrderOnly` is checked
// against earlier orders with the same email or phone. Checkout lists them all as offers.
// Sample codes for the preview: replace with TATTV's real offers before launch.
export const COUPONS: Record<string, Coupon> = {
  WELCOME10: { percent: 10, firstOrderOnly: true, label: "10% off your first order" },
  TATTV15: { percent: 15, minSubtotal: 2999, label: "15% off orders above ₹2,999" },
  ELEMENT20: { percent: 20, minSubtotal: 4999, label: "20% off orders above ₹4,999" },
};

/** Why a code can't be used on this bag yet, or "" if it can (first-order checks happen at the server). */
export function couponBlocker(code: string, subtotal: number): string {
  const c = COUPONS[code];
  if (!c) return "That code is not valid";
  if (c.minSubtotal && subtotal < c.minSubtotal) return `Add ₹${(c.minSubtotal - subtotal).toLocaleString("en-IN")} more to use ${code}`;
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

export const whatsappLink = (text: string) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;

/** The general "talk to us" WhatsApp link: the floating button, footer, contact and help pages. */
export const WHATSAPP_HELLO = whatsappLink("Hi TATTV! I’d love to know more about your products");

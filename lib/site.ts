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
  label: string;
}

// Discount codes, checked on the server when an order is placed. `firstOrderOnly` is checked
// against earlier orders with the same email or phone.
export const COUPONS: Record<string, Coupon> = {
  WELCOME10: { percent: 10, firstOrderOnly: true, label: "10% off your first order" },
};

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

import "server-only";
import crypto from "node:crypto";
import { safeEqual } from "./auth";

// Razorpay is live once RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set (try rzp_test_ keys first).
// Without keys the store runs in demo mode: a simulated payment window and no real money.

export const razorpayEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || "";

export async function createRazorpayOrder({ amount, receipt, notes }: { amount: number; receipt: string; notes: Record<string, string> }) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: "Basic " + auth, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: "INR", receipt, notes }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Razorpay order failed", res.status, await res.text());
    throw new Error("Could not start the payment. Please try again.");
  }
  return (await res.json()) as { id: string };
}

export interface RazorpayResponse {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }: RazorpayResponse) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  return safeEqual(expected, razorpay_signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!s || !signature) return false;
  return safeEqual(crypto.createHmac("sha256", s).update(rawBody).digest("hex"), signature);
}

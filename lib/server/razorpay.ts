import "server-only";
import crypto from "node:crypto";
import { safeEqual } from "./auth";

// Razorpay is live once RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set (try rzp_test_ keys first).
// Without keys the store runs in demo mode: a simulated payment window and no real money.

export const razorpayEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || "";

const basicAuth = () => "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

export async function createRazorpayOrder({ amount, receipt, notes }: { amount: number; receipt: string; notes: Record<string, string> }) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/json" },
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

type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<Result<T>> {
  if (!razorpayEnabled()) return { ok: false, reason: "Razorpay keys are not set" };
  try {
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: basicAuth(), "Content-Type": "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: d?.error?.description || `HTTP ${res.status}` };
    return { ok: true, data: d as T };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

/** A payment as Razorpay has it: amounts in paise. */
export const fetchPayment = (paymentId: string) =>
  call<{ id: string; status: string; amount: number; amount_refunded: number }>(`/payments/${encodeURIComponent(paymentId)}`);

/** Sends money back on a captured payment: the whole of `amountPaise` or part of what was paid. */
export const createRefund = (paymentId: string, { amountPaise, notes }: { amountPaise: number; notes: Record<string, string> }) =>
  call<{ id: string; amount: number; status: string }>(`/payments/${encodeURIComponent(paymentId)}/refund`, { method: "POST", body: { amount: amountPaise, speed: "normal", notes } });

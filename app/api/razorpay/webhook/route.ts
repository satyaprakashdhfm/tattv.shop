import { handler, json } from "@/lib/server/http";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { completePayment, findByRazorpayOrder } from "@/lib/server/orders";

// Safety net: Razorpay calls this when a payment is captured, so an order is confirmed even if the
// customer closes the tab first. Razorpay → Settings → Webhooks: URL https://<site>/api/razorpay/webhook,
// event "payment.captured", secret = RAZORPAY_WEBHOOK_SECRET.
export const POST = handler(async (req) => {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) return json({ error: "Bad signature" }, { status: 400 });
  const event = JSON.parse(raw);
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const p = event.payload.payment.entity;
    const id = await findByRazorpayOrder(p.order_id);
    if (id) await completePayment(id, null, { razorpay_order_id: p.order_id, razorpay_payment_id: p.id }, { viaWebhook: true });
  }
  return json({ ok: true });
});

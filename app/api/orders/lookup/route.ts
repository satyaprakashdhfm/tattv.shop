import { body, handler, json } from "@/lib/server/http";
import { lookupOrder } from "@/lib/server/orders";

// Guests find an order with its number plus the email or phone used at checkout.
export const POST = handler(async (req) => {
  const { id, contact } = await body<{ id: string; contact: string }>(req);
  const order = await lookupOrder(id, contact);
  if (!order) return json({ error: "We couldn't find an order with those details." }, { status: 404 });
  return json({ id: order.id, token: order.token });
});

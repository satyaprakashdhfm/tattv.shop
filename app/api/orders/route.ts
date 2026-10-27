import { body, handler, json } from "@/lib/server/http";
import { createOrder, publicOrder } from "@/lib/server/orders";

// Place an order. Prices, discounts and stock are all checked here, never trusted from the browser.
export const POST = handler(async (req) => {
  const { order, payment } = await createOrder(await body(req));
  return json({ order: publicOrder(order), token: order.token, payment });
});

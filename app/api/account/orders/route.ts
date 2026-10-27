import { body, handler, json } from "@/lib/server/http";
import { accountOrders, publicOrder } from "@/lib/server/orders";
import { DEMO_CREDENTIALS } from "@/lib/demo-account";

// My Account's order list. `refs` are the { id, token } pairs saved in this browser at checkout;
// `preview` adds the sample customer's orders (its sign-in is browser-only, so they are sample data).
export const POST = handler(async (req) => {
  const { refs, preview } = await body<{ refs?: unknown; preview?: boolean }>(req);
  const orders = await accountOrders(refs, preview === true ? DEMO_CREDENTIALS.email : null);
  return json({ orders: orders.map((o) => ({ ...publicOrder(o), token: o.token })) });
});

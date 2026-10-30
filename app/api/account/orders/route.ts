import { body, handler, json } from "@/lib/server/http";
import { accountOrders, publicOrder } from "@/lib/server/orders";
import { currentCustomer } from "@/lib/server/customers";
import { DEMO_CREDENTIALS } from "@/lib/demo-account";

// My Account's order list: the { id, token } pairs saved in this browser at checkout, plus every order
// with the signed-in customer's mobile. `preview` adds the sample customer's orders (its sign-in is
// browser-only, so they are sample data).
export const POST = handler(async (req) => {
  const { refs, preview } = await body<{ refs?: unknown; preview?: boolean }>(req);
  const me = await currentCustomer();
  const orders = await accountOrders(refs, { email: preview === true ? DEMO_CREDENTIALS.email : null, phone: me?.phone ?? null });
  return json({ orders: orders.map((o) => ({ ...publicOrder(o), token: o.token })) });
});

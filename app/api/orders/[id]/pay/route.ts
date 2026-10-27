import { body, handler, json } from "@/lib/server/http";
import { completePayment, publicOrder } from "@/lib/server/orders";

type Ctx = { params: Promise<{ id: string }> };

// The browser reports a successful payment; the Razorpay signature is verified before the order is confirmed.
export const POST = handler<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const { token, ...resp } = await body<{ token: string }>(req);
  return json({ order: publicOrder(await completePayment(id, token, resp)) });
});

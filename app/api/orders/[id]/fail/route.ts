import { body, handler, json } from "@/lib/server/http";
import { failPayment, publicOrder } from "@/lib/server/orders";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const { token, reason } = await body<{ token: string; reason?: string }>(req);
  return json({ order: publicOrder(await failPayment(id, token, reason)) });
});

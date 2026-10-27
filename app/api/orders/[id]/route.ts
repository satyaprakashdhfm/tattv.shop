import { handler, json } from "@/lib/server/http";
import { getOrderFor, publicOrder } from "@/lib/server/orders";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const order = await getOrderFor(id, new URL(req.url).searchParams.get("t"));
  if (!order) return json({ error: "Order not found" }, { status: 404 });
  return json({ order: publicOrder(order) });
});

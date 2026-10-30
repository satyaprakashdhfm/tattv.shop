import { body, handler, json, rateLimit } from "@/lib/server/http";
import { getOrderFor } from "@/lib/server/orders";
import { reviewForOrder, submitReview } from "@/lib/server/reviews";

type Ctx = { params: Promise<{ id: string }> };

// The star rating on a delivered order's page: whether one was left (GET), and leaving it (POST).
// Both need the order's private link token, like the order page itself.
export const GET = handler<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const order = await getOrderFor(id, new URL(req.url).searchParams.get("t"));
  if (!order) return json({ error: "Order not found" }, { status: 404 });
  const r = await reviewForOrder(order.id);
  return json({ review: r && { rating: r.rating, title: r.title, body: r.body } });
});

export const POST = handler<Ctx>(async (req, { params }) => {
  rateLimit(req, "review", 10, 10);
  const { id } = await params;
  const { token, rating, title, body: text } = await body<{ token?: string; rating?: number; title?: string; body?: string }>(req);
  const r = await submitReview(id, token ?? null, { rating, title, body: text });
  return json({ review: { rating: r.rating, title: r.title, body: r.body } });
});

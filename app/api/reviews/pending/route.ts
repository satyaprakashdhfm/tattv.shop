import { body, handler, json } from "@/lib/server/http";
import { currentCustomer } from "@/lib/server/customers";
import { orderAwaitingReview } from "@/lib/server/reviews";

export const dynamic = "force-dynamic";

// The "Rate your order" pop-up asks here: a delivered order of this visitor (orders saved in this browser,
// each proven by its token, or the signed-in customer's) that has no review yet.
export const POST = handler(async (req) => {
  const { refs } = await body<{ refs?: unknown }>(req);
  const me = await currentCustomer();
  return json({ order: await orderAwaitingReview(refs, me?.phone ?? null) });
});

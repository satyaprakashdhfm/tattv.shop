import { body, handler, json, rateLimit } from "@/lib/server/http";
import { checkCoupon } from "@/lib/server/coupons";
import { pool } from "@/lib/server/db";
import { currentCustomer } from "@/lib/server/customers";

export const dynamic = "force-dynamic";

// Checkout's "Apply": whether a typed code works for this customer. It only answers; the order is
// priced and every rule checked again when it is placed.
export const POST = handler(async (req) => {
  rateLimit(req, "coupon-check", 15, 10);
  const { code, email, phone } = await body<{ code?: string; email?: string; phone?: string }>(req);
  const me = await currentCustomer();
  return json({ offer: await checkCoupon(await pool(), code, { email, phone }, { signedInPhone: me?.phone ?? null }) });
});

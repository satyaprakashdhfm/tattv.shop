import { handler, json } from "@/lib/server/http";
import { currentCustomer } from "@/lib/server/customers";
import { couponsOwnedBy } from "@/lib/server/coupons";
import { offerName } from "@/lib/site";

export const dynamic = "force-dynamic";

// My Account → coupons the store gave this customer (linked to their mobile or email).
export const GET = handler(async () => {
  const me = await currentCustomer();
  if (!me) return json({ error: "Please sign in" }, { status: 401 });
  const list = await couponsOwnedBy(me.phone);
  return json({
    coupons: list.map((c) => ({ code: c.code, name: offerName(c), label: c.label, expiresAt: c.expiresAt, usable: c.state === "on" })),
  });
});

import { handler, json, rateLimit } from "@/lib/server/http";
import { deliveryCheck } from "@/lib/server/delhivery";

export const dynamic = "force-dynamic";

// Checkout asks this once a 6-digit PIN code is typed: can Delhivery deliver there, is cash on delivery
// possible, and roughly how many days. Without a Delhivery token every PIN code is accepted.
export const GET = handler(async (req) => {
  rateLimit(req, "delivery-check", 40, 10);
  const r = await deliveryCheck(new URL(req.url).searchParams.get("pin") || "");
  return json(r);
});

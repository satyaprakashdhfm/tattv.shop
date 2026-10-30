import { handler, json } from "@/lib/server/http";
import { publicOffers } from "@/lib/server/coupons";

export const dynamic = "force-dynamic";

// Codes listed under "Offers & Coupons" at checkout (personal codes are never listed).
export const GET = handler(async () => json({ offers: await publicOffers() }));

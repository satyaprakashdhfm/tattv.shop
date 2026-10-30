import { handler, json } from "@/lib/server/http";
import { currentCustomer } from "@/lib/server/customers";

export const dynamic = "force-dynamic";

export const GET = handler(async () => json({ customer: await currentCustomer() }));

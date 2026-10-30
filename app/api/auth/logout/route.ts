import { handler, json } from "@/lib/server/http";
import { endCustomerSession } from "@/lib/server/customers";

export const POST = handler(async () => {
  await endCustomerSession();
  return json({ ok: true });
});

import { body, handler, json } from "@/lib/server/http";
import { currentCustomer, saveProfile } from "@/lib/server/customers";

// My Account → Personal Details.
export const POST = handler(async (req) => {
  const me = await currentCustomer();
  if (!me) return json({ error: "Please sign in" }, { status: 401 });
  return json({ customer: await saveProfile(me.phone, await body(req)) });
});

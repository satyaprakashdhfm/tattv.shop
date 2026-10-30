import { body, handler, json, rateLimit } from "@/lib/server/http";
import { checkOtp, verifyWidgetToken } from "@/lib/server/otp";
import { startCustomerSession } from "@/lib/server/customers";

// Checks the code (or MSG91's widget token, confirmed with MSG91) and signs the customer in.
export const POST = handler(async (req) => {
  rateLimit(req, "otp-verify", 15, 10);
  const { phone, code, accessToken } = await body<{ phone?: string; code?: string; accessToken?: string }>(req);
  const verified = accessToken ? await verifyWidgetToken(accessToken) : await checkOtp(phone, code);
  return json({ customer: await startCustomerSession(verified) });
});

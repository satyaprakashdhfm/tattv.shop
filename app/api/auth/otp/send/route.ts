import { body, handler, json, rateLimit } from "@/lib/server/http";
import { sendOtp } from "@/lib/server/otp";

// Texts a 6-digit login code (when MSG91's widget isn't used).
export const POST = handler(async (req) => {
  rateLimit(req, "otp-send", 5, 10);
  const { phone } = await body<{ phone?: string }>(req);
  return json(await sendOtp(phone));
});

import { body, handler, json, rateLimit } from "@/lib/server/http";
import { requestStockAlert } from "@/lib/server/stock-alerts";

// "Notify me" on a sold-out product page: the shopper's name and WhatsApp number for when it is back.
export const POST = handler(async (req) => {
  rateLimit(req, "notify", 10, 10);
  await requestStockAlert(await body(req));
  return json({ ok: true });
});

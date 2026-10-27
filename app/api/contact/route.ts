import { body, handler, json } from "@/lib/server/http";
import { createMessage } from "@/lib/server/orders";

// Contact form and return requests; they land in Admin → Messages.
export const POST = handler(async (req) => {
  const input = await body(req);
  if (input.website) return json({ ok: true }); // honeypot: bots fill it, people never see it
  await createMessage(input);
  return json({ ok: true });
});

import "server-only";

// WhatsApp messages to customers through the WhatsApp Business Cloud API (Meta). Not connected yet: until
// these are set, nothing is sent and callers mark their messages as waiting.
//
//   WHATSAPP_TOKEN           a permanent access token for the WhatsApp Business account
//   WHATSAPP_PHONE_NUMBER_ID the sending number's ID (WhatsApp Manager → Phone numbers)
//   WHATSAPP_TEMPLATE_RESTOCK  optional: an approved template name for "back in stock" (needed to message
//                            someone who hasn't written to the store in the last 24 hours). Its body takes
//                            three values: name, product, link. Without it a plain text message is tried.
//   WHATSAPP_TEMPLATE_LANG   the template's language code (default en)

const TOKEN = () => process.env.WHATSAPP_TOKEN || "";
const PHONE_ID = () => process.env.WHATSAPP_PHONE_NUMBER_ID || "";

export const whatsappConfigured = () => !!(TOKEN() && PHONE_ID());

/** Sends a WhatsApp message to an Indian mobile. Never throws. */
export async function sendWhatsApp(phone: string, text: string, opts: { template?: "restock"; params?: string[] } = {}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!whatsappConfigured()) return { ok: false, reason: "WhatsApp is not connected yet" };
  const to = `91${String(phone).replace(/\D/g, "").slice(-10)}`;
  const template = opts.template === "restock" ? process.env.WHATSAPP_TEMPLATE_RESTOCK : undefined;
  const message = template
    ? {
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
          components: [{ type: "body", parameters: (opts.params ?? []).map((t) => ({ type: "text", text: t })) }],
        },
      }
    : { type: "text", text: { body: text, preview_url: true } };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID()}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, ...message }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: d?.error?.message || `WhatsApp answered ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

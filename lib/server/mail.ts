import "server-only";
import { loadCatalogData } from "./catalog";

// Email through Resend's REST API (one fetch, no SDK), as on Minimalstoys.
//
//   RESEND_KEY   resend.com → API Keys (RESEND_API_KEY also works)
//   MAIL_FROM    the sending address, default contact@tattv.co.in. Its domain (tattv.co.in) must be verified
//                in Resend → Domains (a few DNS records), or Resend refuses every message.
//   STORE_EMAIL  where new-order alerts, contact messages and return requests go (default: Site Settings email)
//
// Alerts for the store are sent as "TATTV Website"; emails to customers as "TATTV". Without a key, mail is
// written to the server log instead (the terminal locally, Deploy Logs on Railway). Sending never throws:
// a mail problem must not fail an order or a payment.

export interface Mail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  /** "store" for alerts to TATTV, "customer" (default) for emails to shoppers. */
  audience?: "store" | "customer";
}

const apiKey = () => (process.env.RESEND_KEY || process.env.RESEND_API_KEY || "").trim();
const fromAddress = () => (process.env.MAIL_FROM || "contact@tattv.co.in").replace(/^.*<([^>]+)>.*$/, "$1").trim();
export const mailConfigured = () => !!apiKey();

export async function sendMail(mail: Mail) {
  if (!mail.to) return;
  if (!apiKey()) {
    console.log(
      ["", "──── EMAIL (not sent: RESEND_KEY is not set) ────", `To: ${mail.to}`, mail.replyTo ? `Reply-To: ${mail.replyTo}` : "", `Subject: ${mail.subject}`, "", mail.text, "────────────────────────────────────────────────", ""].join("\n"),
    );
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${mail.audience === "store" ? "TATTV Website" : "TATTV"} <${fromAddress()}>`,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
    console.log("[mail] sent:", mail.subject, "→", mail.to);
  } catch (e) {
    console.error("[mail] send failed:", mail.subject, "-", (e as Error).message);
  }
}

/** The store's inbox (STORE_EMAIL, or the Site Settings email), where alerts, contact messages and return requests go. */
export async function storeInbox() {
  return process.env.STORE_EMAIL || (await loadCatalogData()).settings.email;
}

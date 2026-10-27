import "server-only";
import { loadCatalogData } from "./catalog";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/**
 * Sends an email. No mail provider is connected yet, so for now the email is written to the server
 * log (the terminal locally, Deploy Logs on Railway). Connect a provider here later; callers stay the same.
 */
export async function sendMail(mail: Mail) {
  console.log(
    ["", "──── EMAIL (not sent: no mail provider yet) ────", `To: ${mail.to}`, mail.replyTo ? `Reply-To: ${mail.replyTo}` : "", `Subject: ${mail.subject}`, "", mail.text, "────────────────────────────────────────────────", ""]
      .filter((l) => l !== null)
      .join("\n"),
  );
}

/** The store's inbox (Site Settings email, or STORE_EMAIL), where contact messages and return requests are sent. */
export async function storeInbox() {
  return process.env.STORE_EMAIL || (await loadCatalogData()).settings.email;
}

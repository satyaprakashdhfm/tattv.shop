import "server-only";
import crypto from "node:crypto";
import { OrderError, normalisePhone } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import { query } from "./db";
import { sendWhatsApp, whatsappConfigured } from "./whatsapp";

// "Notify me" for sold-out pieces. A shopper leaves their name and WhatsApp number on the product page;
// when the piece is back in stock (any stock change: the product form, Stock & Prices, a cancelled order
// putting stock back), each waiting request gets a WhatsApp message automatically and is marked sent.
// Until WhatsApp is connected (lib/server/whatsapp.ts) they are marked "back in stock, message waiting"
// and Admin → Notify Requests offers a one-tap WhatsApp link to send it by hand.

export type AlertStatus = "waiting" | "ready" | "sent" | "failed";

export interface StockAlert {
  id: string;
  productSlug: string;
  name: string;
  phone: string;
  createdAt: string;
  status: AlertStatus;
  notifiedAt: string | null;
  note: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- raw rows */
const toAlert = (r: any): StockAlert => ({
  id: r.id,
  productSlug: r.product_slug,
  name: r.name,
  phone: r.phone,
  createdAt: new Date(r.created_at).toISOString(),
  status: r.status,
  notifiedAt: r.notified_at ? new Date(r.notified_at).toISOString() : null,
  note: r.note,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/** A shopper asks to be told when a sold-out piece is back. One request per number per piece. */
export async function requestStockAlert(input: { slug?: unknown; name?: unknown; phone?: unknown }) {
  const slug = String(input.slug || "");
  const phone = normalisePhone(input.phone);
  if (!/^[6-9]\d{9}$/.test(phone)) throw new OrderError("Enter a valid 10-digit WhatsApp number.");
  const p = await query<{ stock: number | null; active: boolean }>("SELECT stock, active FROM products WHERE slug = $1", [slug]);
  if (!p.rowCount || !p.rows[0].active) throw new OrderError("This piece is no longer available.", 404);
  if (p.rows[0].stock !== 0) throw new OrderError("Good news: this piece is in stock now. You can order it straight away.");
  await query(
    `INSERT INTO stock_alerts (id, product_slug, name, phone) VALUES ($1,$2,$3,$4)
     ON CONFLICT (product_slug, phone) WHERE status = 'waiting' DO UPDATE SET name = EXCLUDED.name`,
    ["sa_" + crypto.randomBytes(6).toString("hex"), slug, String(input.name || "").trim().slice(0, 60), phone],
  );
}

export const restockMessage = (name: string, product: string, slug: string) =>
  `Hi${name ? ` ${name}` : ""}! Good news from TATTV: ${product} is back in stock. Get yours before it sells out again: ${SITE_URL}/product/${slug}`;

/**
 * Sends the "back in stock" message for every waiting request whose piece is in stock again.
 * Called after any stock change; safe to call often (it only touches waiting or unsent requests).
 */
export async function notifyRestocked() {
  const r = await query(
    `SELECT a.*, p.name AS product_name FROM stock_alerts a JOIN products p ON p.slug = a.product_slug
     WHERE a.status IN ('waiting', 'ready') AND p.active AND (p.stock IS NULL OR p.stock > 0)`,
  );
  for (const row of r.rows) {
    const text = restockMessage(row.name, row.product_name, row.product_slug);
    if (!whatsappConfigured()) {
      if (row.status === "waiting") await query("UPDATE stock_alerts SET status = 'ready', note = $2 WHERE id = $1", [row.id, "Back in stock. WhatsApp isn't connected yet, so send the message from the admin."]);
      continue;
    }
    const sent = await sendWhatsApp(row.phone, text, { template: "restock", params: [row.name || "there", row.product_name, `${SITE_URL}/product/${row.product_slug}`] });
    await query("UPDATE stock_alerts SET status = $2, notified_at = CASE WHEN $2 = 'sent' THEN now() ELSE notified_at END, note = $3 WHERE id = $1", [
      row.id,
      sent.ok ? "sent" : "failed",
      sent.ok ? "Sent automatically on WhatsApp" : `Not sent: ${sent.reason}`,
    ]);
  }
}

/** Fire-and-forget after a stock change: a messaging problem must never fail the admin's save. */
export const afterStockChange = () => {
  notifyRestocked().catch((e) => console.error("[stock alerts]", (e as Error).message));
};

export async function markAlertSent(id: string) {
  await query("UPDATE stock_alerts SET status = 'sent', notified_at = now(), note = 'Sent by hand from the admin' WHERE id = $1", [id]);
}

export async function deleteAlert(id: string) {
  await query("DELETE FROM stock_alerts WHERE id = $1", [id]);
}

/** Admin → Notify Requests: every request, newest first (grouped by product on the page). */
export async function listAlerts(): Promise<StockAlert[]> {
  const r = await query("SELECT * FROM stock_alerts ORDER BY created_at DESC");
  return r.rows.map(toAlert);
}

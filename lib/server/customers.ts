import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { OrderError } from "@/lib/pricing";
import { query } from "./db";

// Customer accounts. A customer signs in with their mobile number and a one-time code (lib/server/otp.ts);
// the number is the account, so their orders and personal coupons are the ones with that number. The
// session is a signed cookie, like the admin's: base64url(JSON) + "." + HMAC-SHA256.

const COOKIE = "tattv_user";
const isProd = process.env.NODE_ENV === "production";
const secret = () => process.env.SESSION_SECRET || (isProd ? null : "dev-only-secret");

export interface Customer {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
}

function sign(payload: object) {
  const key = secret();
  if (!key) throw new OrderError("Sign-in is not set up yet (SESSION_SECRET is missing).", 503);
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return body + "." + crypto.createHmac("sha256", key).update(body).digest("base64url");
}

function verify(token: string | undefined): { phone?: string; exp?: number } | null {
  const key = secret();
  if (!key || !token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const want = crypto.createHmac("sha256", key).update(body).digest("base64url");
  if (mac.length !== want.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(want))) return null;
  try {
    const d = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof d.exp === "number" && Date.now() > d.exp ? null : d;
  } catch {
    return null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any -- raw rows */
const toCustomer = (r: any): Customer => ({
  phone: r.phone,
  firstName: r.first_name,
  lastName: r.last_name,
  email: r.email,
  memberSince: new Date(r.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Signs the customer in after their code is checked. A first-timer's name and email are taken from
 * their latest order with this number, if any, so returning shoppers don't type them again.
 */
export async function startCustomerSession(phone: string) {
  const r = await query(
    `INSERT INTO customers (phone, first_name, last_name, email)
     SELECT $1, COALESCE(o.first_name, ''), COALESCE(o.last_name, ''), COALESCE(o.email, '')
     FROM (SELECT 1) x LEFT JOIN LATERAL (SELECT first_name, last_name, email FROM orders WHERE phone = $1 ORDER BY created_at DESC LIMIT 1) o ON true
     ON CONFLICT (phone) DO UPDATE SET last_login_at = now()
     RETURNING *`,
    [phone],
  );
  (await cookies()).set(COOKIE, sign({ phone, exp: Date.now() + 30 * 86400_000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 30 * 86400,
  });
  return toCustomer(r.rows[0]);
}

export async function endCustomerSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in customer, or null. */
export async function currentCustomer(): Promise<Customer | null> {
  const s = verify((await cookies()).get(COOKIE)?.value);
  if (!s?.phone) return null;
  const r = await query("SELECT * FROM customers WHERE phone = $1", [s.phone]);
  return r.rows[0] ? toCustomer(r.rows[0]) : null;
}

export async function saveProfile(phone: string, input: { firstName?: unknown; lastName?: unknown; email?: unknown }) {
  const text = (v: unknown) => String(v ?? "").trim().slice(0, 80);
  const email = text(input.email).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OrderError("Enter a valid email.");
  const r = await query("UPDATE customers SET first_name = $2, last_name = $3, email = $4 WHERE phone = $1 RETURNING *", [phone, text(input.firstName), text(input.lastName), email]);
  if (!r.rowCount) throw new OrderError("Please sign in again.", 401);
  return toCustomer(r.rows[0]);
}

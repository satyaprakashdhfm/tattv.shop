import "server-only";
import crypto from "node:crypto";
import { OrderError, normalisePhone } from "@/lib/pricing";
import { query, transaction } from "./db";

// Mobile login codes, through MSG91 (ported from the Minimalstoys backend). Two ways, set up with keys:
//
// 1. MSG91's OTP widget (preferred: no DLT template of our own). The widget runs in the browser, shows
//    MSG91's captcha, texts the code with MSG91's default template and checks it, then hands the page a
//    short-lived access token. That token proves nothing until MSG91 confirms it here, server to server:
//      POST https://control.msg91.com/api/v5/widget/verifyAccessToken  { authkey, "access-token" }
//      → { type: "success", message: "91XXXXXXXXXX" }
//    Needs MSG91_TOKEN (the authkey, kept on the server), MSG91_WIDGET_ID and MSG91_WIDGET_TOKEN (public by design).
//
// 2. Our own 6-digit code, texted with MSG91's OTP API and a DLT-approved template whose text uses ##OTP##.
//    Needs MSG91_TOKEN and MSG91_TEMPLATE_ID. Good for 5 minutes and 5 tries; only a hash is stored.
//
// With neither, local development shows the code on screen (anyone could then sign in as any number, so
// never on the live site), and the live site says mobile login is coming soon.
//
// Switched off until CUSTOMER_OTP_LOGIN=true, even with the MSG91 keys in place: until then the account
// page offers the preview (test) account only.

const isProd = process.env.NODE_ENV === "production";
const authkey = () => process.env.MSG91_TOKEN || process.env.MSG91_AUTH_KEY || "";
const TTL = 5 * 60_000;
const RESEND = 30_000;
const PER_HOUR = 5;

export const widgetReady = () => !!(authkey() && process.env.MSG91_WIDGET_ID && process.env.MSG91_WIDGET_TOKEN);
export const templateReady = () => !!(authkey() && process.env.MSG91_TEMPLATE_ID);
export const showCode = () => !widgetReady() && !templateReady() && !isProd;
export const otpSwitchedOn = () => process.env.CUSTOMER_OTP_LOGIN === "true";
export const otpAvailable = () => otpSwitchedOn() && (widgetReady() || templateReady() || showCode());

/** What the browser needs to show the right login form. */
export function otpConfig() {
  return {
    available: otpAvailable(),
    widget: widgetReady() ? { widgetId: process.env.MSG91_WIDGET_ID!, tokenAuth: process.env.MSG91_WIDGET_TOKEN! } : null,
    /** Local development without MSG91: the code comes back on screen. */
    testMode: showCode(),
  };
}

/**
 * Approval codes to the owner's mobile (cancelling and refunding orders): not tied to the customer login
 * switch. "widget" when MSG91's widget sends them from the admin page, "code" for our own code, else null.
 */
export const ownerCodes = () => (widgetReady() ? "widget" : templateReady() || showCode() ? "code" : null);

export function validMobile(v: unknown) {
  const p = normalisePhone(v);
  return /^[6-9]\d{9}$/.test(p) ? p : null;
}

// ── 1. MSG91 widget ──
/** The 10-digit mobile MSG91 verified for this token. Each token works once, so one seen in transit can't sign in again. */
export async function verifyWidgetToken(accessToken: unknown) {
  if (!widgetReady()) throw new OrderError("Mobile login is not switched on yet.", 503);
  const token = String(accessToken || "");
  if (token.length < 20 || token.length > 4000) throw new OrderError("That code could not be verified. Please try again.", 401);
  let reply: { type?: string; message?: unknown; code?: unknown } | null;
  try {
    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ authkey: authkey(), "access-token": token }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    reply = await res.json().catch(() => null);
  } catch (e) {
    console.error("[MSG91] verify request failed", (e as Error).message);
    throw new OrderError("We could not complete the mobile check. Please try again.", 502);
  }
  if (reply?.type !== "success" || typeof reply.message !== "string") {
    // "AuthenticationFailure" is about our authkey (wrong key, or MSG91's IP whitelist), not the person's code.
    if (reply?.message === "AuthenticationFailure") {
      console.error("[MSG91] authkey refused (code %s): check MSG91_TOKEN and MSG91's IP whitelist", reply?.code);
      throw new OrderError("Mobile login is not available right now. Please try again later.", 503);
    }
    throw new OrderError("That code could not be verified. Please try again.", 401);
  }
  const phone = validMobile(reply.message);
  if (!phone) throw new OrderError("Please use an Indian mobile number.");
  const key = crypto.createHash("sha256").update(token).digest("hex");
  const fresh = await query("INSERT INTO otp_tokens (key) VALUES ($1) ON CONFLICT DO NOTHING", [key]);
  if (!fresh.rowCount) throw new OrderError("That code was already used. Please ask for a new one.", 401);
  return phone;
}

// ── 2. Our own code ──
const hash = (key: string, code: string) => crypto.createHash("sha256").update(`${key}:${code}:${process.env.SESSION_SECRET || "tattv-otp"}`).digest("hex");

async function sendSms(phone: string, code: string) {
  const qs = new URLSearchParams({ template_id: process.env.MSG91_TEMPLATE_ID!, mobile: `91${phone}`, otp: code, otp_expiry: String(TTL / 60_000) });
  const res = await fetch(`https://control.msg91.com/api/v5/otp?${qs}`, {
    method: "POST",
    headers: { authkey: authkey(), "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.type !== "success") {
    console.error("[MSG91] SMS failed", res.status, d.message);
    throw new OrderError("We couldn't send the code just now. Please try again in a minute.", 502);
  }
}

/**
 * Texts a 6-digit code. Returns { resendIn, code? }: the code only in local test mode. `scope` keeps a
 * code for one purpose (an owner's approval for one order) apart from login codes to the same number.
 */
export async function sendOtp(rawPhone: unknown, { scope = "" } = {}) {
  if (scope ? ownerCodes() !== "code" : !otpAvailable()) throw new OrderError("Mobile login is coming soon. You can still check out as a guest.", 503);
  const phone = validMobile(rawPhone);
  if (!phone) throw new OrderError("Enter a valid 10-digit mobile number.");
  const key = scope ? `${scope}:${phone}` : phone;
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await transaction(async (db) => {
    const prev = (await db.query<{ sent_at: Date; sends: Date[] }>("SELECT sent_at, sends FROM otps WHERE key = $1 FOR UPDATE", [key])).rows[0];
    const sends = (prev?.sends ?? []).filter((t) => Date.now() - new Date(t).getTime() < 3600_000);
    if (prev && Date.now() - prev.sent_at.getTime() < RESEND) throw new OrderError("Please wait a few seconds before asking for a new code.", 429);
    if (sends.length >= PER_HOUR) throw new OrderError("Too many codes asked for this number. Please try again in an hour.", 429);
    await db.query(
      `INSERT INTO otps (key, hash, exp, tries, sent_at, sends) VALUES ($1, $2, $3, 0, now(), $4)
       ON CONFLICT (key) DO UPDATE SET hash = EXCLUDED.hash, exp = EXCLUDED.exp, tries = 0, sent_at = now(), sends = EXCLUDED.sends`,
      [key, hash(key, code), new Date(Date.now() + TTL), [...sends, new Date()]],
    );
  });
  if (templateReady()) await sendSms(phone, code);
  return { resendIn: RESEND / 1000, ...(showCode() ? { code } : {}) };
}

/** The phone number when the code matches; the code can't be used again afterwards. */
export async function checkOtp(rawPhone: unknown, code: unknown, { scope = "" } = {}) {
  const phone = validMobile(rawPhone);
  if (!phone || !/^\d{6}$/.test(String(code || ""))) throw new OrderError("Enter the 6-digit code.");
  const key = scope ? `${scope}:${phone}` : phone;
  return transaction(async (db) => {
    const o = (await db.query<{ hash: string; exp: Date; tries: number }>("SELECT hash, exp, tries FROM otps WHERE key = $1 FOR UPDATE", [key])).rows[0];
    if (!o || Date.now() > o.exp.getTime()) throw new OrderError("This code has expired. Please ask for a new one.");
    if (o.tries >= 5) throw new OrderError("Too many wrong tries. Please ask for a new code.", 429);
    if (o.hash !== hash(key, String(code))) {
      await db.query("UPDATE otps SET tries = tries + 1 WHERE key = $1", [key]);
      throw new OrderError("That code isn't right. Please check and try again.");
    }
    await db.query("UPDATE otps SET exp = now() WHERE key = $1", [key]);
    return phone;
  });
}

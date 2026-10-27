import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Admin sessions: a signed cookie, base64url(JSON payload) + "." + HMAC-SHA256. No session table needed.

const ADMIN_COOKIE = "tattv_admin";
const isProd = process.env.NODE_ENV === "production";

// Testing shortcut: with ADMIN_TEST_LOGIN=true these credentials work and are shown on the login
// page. Anyone who finds /admin can then sign in, so switch it off before launch.
export const TEST_ADMIN = { username: "admin", password: "tattv-test" };
export const adminTestLogin = () => process.env.ADMIN_TEST_LOGIN === "true";

function secret(): string | null {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.ADMIN_PASSWORD) return crypto.createHash("sha256").update("tattv:" + process.env.ADMIN_PASSWORD).digest("hex");
  if (adminTestLogin()) return "tattv-test-mode-secret";
  return isProd ? null : "dev-only-secret";
}

export function safeEqual(a: string, b: string) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function sign(payload: object) {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is not configured");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return body + "." + crypto.createHmac("sha256", key).update(body).digest("base64url");
}

function verify(token: string | undefined): Record<string, unknown> | null {
  const key = secret();
  if (!key || typeof token !== "string") return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  if (!safeEqual(mac, crypto.createHmac("sha256", key).update(body).digest("base64url"))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof data.exp === "number" && Date.now() > data.exp ? null : data;
  } catch {
    return null;
  }
}

const adminUsername = () => (process.env.ADMIN_USERNAME || "admin").toLowerCase();
export const adminConfigured = () => !!process.env.ADMIN_PASSWORD || adminTestLogin();

// Brute-force guard: 8 wrong attempts per IP per 15 minutes (in memory).
const attempts = new Map<string, { n: number; since: number }>();

export function checkAdminLogin(username: unknown, password: string, ip = "unknown"): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  const a = attempts.get(ip) || { n: 0, since: now };
  if (now - a.since > 15 * 60_000) Object.assign(a, { n: 0, since: now });
  if (a.n >= 8) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  const user = String(username || "").trim().toLowerCase();
  const real = !!process.env.ADMIN_PASSWORD && user === adminUsername() && safeEqual(password, process.env.ADMIN_PASSWORD);
  const test = adminTestLogin() && user === TEST_ADMIN.username && safeEqual(password, TEST_ADMIN.password);
  if (!real && !test) {
    a.n++;
    attempts.set(ip, a);
    return { ok: false, error: adminConfigured() ? "Wrong username or password." : "ADMIN_PASSWORD is not set on the server." };
  }
  attempts.delete(ip);
  return { ok: true };
}

export async function startAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, sign({ role: "admin", exp: Date.now() + 7 * 86400_000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 7 * 86400,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  return verify((await cookies()).get(ADMIN_COOKIE)?.value)?.role === "admin";
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

import "server-only";
import crypto from "node:crypto";
import { SITE_URL } from "@/lib/site";

// Google Search Console, read-only, for Admin → Google Search: how often the store shows up in Google,
// the searches and pages, and when Google last read the sitemap. Ported from the Minimalstoys backend
// (Search Console only: no visitor tracking).
//
//   GOOGLE_SERVICE_ACCOUNT_JSON  a Google Cloud service account's key file, pasted whole (one line, or base64)
//                                with the Search Console API switched on in that Cloud project. Add the
//                                account's client_email as a user on the Search Console property.
//   SEARCH_CONSOLE_SITE          optional: the property, e.g. sc-domain:tattv.shop (the default) or
//                                https://tattv.shop/ for a URL-prefix property.
//
// Free to use. Reports are cached for 30 minutes per period.

const RAW = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
const SITE = () => (process.env.SEARCH_CONSOLE_SITE || `sc-domain:${new URL(SITE_URL).hostname.replace(/^www\./, "")}`).trim();
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

// Railway turns each \n inside private_key into a real line break when the key is pasted as one line; undone here.
function readKey(): { key: { email: string; privateKey: string } | null; problem: string | null } {
  if (!RAW) return { key: null, problem: "GOOGLE_SERVICE_ACCOUNT_JSON is not set." };
  let parsed: { client_email?: string; private_key?: string } | null = null;
  for (const text of [RAW, RAW.replace(/\r?\n/g, "\\n"), Buffer.from(RAW, "base64").toString("utf8")]) {
    try {
      parsed = JSON.parse(text);
      break;
    } catch {
      // Try the next form.
    }
  }
  if (!parsed) return { key: null, problem: "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the whole key file exactly as downloaded." };
  if (!parsed.client_email || !parsed.private_key) return { key: null, problem: "GOOGLE_SERVICE_ACCOUNT_JSON is not a service account key (no client_email / private_key)." };
  return { key: { email: parsed.client_email, privateKey: String(parsed.private_key).replace(/\\n/g, "\n") }, problem: null };
}

const { key: KEY, problem: KEY_PROBLEM } = readKey();
export const searchConsoleProblem = () => KEY_PROBLEM;
export const searchConsoleSite = SITE;
export const serviceAccountEmail = () => KEY?.email ?? null;

let token: { value: string; exp: number } | null = null;
async function accessToken() {
  if (token && Date.now() < token.exp - 60_000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: KEY!.email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(KEY!.privateKey, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
    signal: AbortSignal.timeout(15_000),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok || !d.access_token) throw new Error(`Google sign-in failed: ${d.error_description || d.error || res.status}`);
  token = { value: d.access_token, exp: Date.now() + (Number(d.expires_in) || 3600) * 1000 };
  return token.value;
}

type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

/** One Search Console call; never throws, so one failing report doesn't blank the page. */
async function call<T>(path: string, body?: object): Promise<Result<T>> {
  try {
    const res = await fetch(`https://searchconsole.googleapis.com${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403) {
      const msg = String(data?.error?.message || "");
      return { ok: false, reason: /has not been used|is disabled/i.test(msg) ? "The Search Console API is switched off in the Google Cloud project." : `Search Console refused access. Add ${KEY!.email} as a user on the ${SITE()} property.` };
    }
    if (!res.ok) return { ok: false, reason: data?.error?.message || `Google answered ${res.status}` };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, reason: (e as Error).name === "TimeoutError" ? "Google timed out" : (e as Error).message };
  }
}

export interface SearchRow {
  label: string;
  clicks: number;
  impressions: number;
  position: number | null;
}

export interface SeoReport {
  problem: string | null;
  totals: { clicks: number; impressions: number; position: number | null } | null;
  queries: SearchRow[];
  pages: SearchRow[];
  days: { date: string; clicks: number; impressions: number }[];
  sitemap: { path: string; lastRead: string | null; pages: number; errors: number; warnings: number } | null;
}

type ApiRow = { keys?: string[]; clicks: number; impressions: number; position: number };

// Clicks and impressions add up; position is averaged by how often it was shown.
function fold(rows: ApiRow[]) {
  let clicks = 0;
  let impressions = 0;
  let weighted = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    weighted += r.position * r.impressions;
  }
  return { clicks, impressions, position: impressions ? weighted / impressions : null };
}
function group(rows: ApiRow[], keyOf: (r: ApiRow) => string): SearchRow[] {
  const m = new Map<string, ApiRow[]>();
  for (const r of rows) m.set(keyOf(r), [...(m.get(keyOf(r)) ?? []), r]);
  return [...m.entries()].map(([label, list]) => ({ label, ...fold(list) })).sort((a, b) => b.impressions - a.impressions);
}
// www / non-www / trailing-slash versions of a page count as one row.
const pathOf = (url: string) => {
  try {
    return new URL(url).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return url;
  }
};

const cache = new Map<string, { at: number; value: SeoReport }>();

/** The report for from..to (YYYY-MM-DD). */
export async function seoReport(from: string, to: string): Promise<SeoReport> {
  if (KEY_PROBLEM) return { problem: KEY_PROBLEM, totals: null, queries: [], pages: [], days: [], sitemap: null };
  const key = `${from}|${to}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit.value;

  const site = encodeURIComponent(SITE());
  const q = (body: object) => call<{ rows?: ApiRow[] }>(`/webmasters/v3/sites/${site}/searchAnalytics/query`, { startDate: from, endDate: to, dataState: "all", ...body });
  const [total, queries, pages, days, maps] = await Promise.all([
    q({ rowLimit: 1 }),
    q({ dimensions: ["query"], rowLimit: 200 }),
    q({ dimensions: ["page"], rowLimit: 1000 }),
    q({ dimensions: ["date"], rowLimit: 1100 }),
    call<{ sitemap?: { path: string; lastDownloaded?: string; errors?: string; warnings?: string; contents?: { submitted?: string }[] }[] }>(`/webmasters/v3/sites/${site}/sitemaps`),
  ]);
  const problem = [total, queries, pages].find((r) => !r.ok) as { reason: string } | undefined;
  const t = total.ok ? total.data.rows?.[0] : null;
  const sm = maps.ok ? (maps.data.sitemap ?? []).find((s) => s.path.endsWith("/sitemap.xml")) ?? maps.data.sitemap?.[0] : null;
  const value: SeoReport = {
    problem: problem?.reason ?? null,
    totals: t ? { clicks: t.clicks, impressions: t.impressions, position: t.position } : total.ok ? { clicks: 0, impressions: 0, position: null } : null,
    queries: queries.ok ? group(queries.data.rows ?? [], (r) => r.keys![0].trim().toLowerCase()).slice(0, 10) : [],
    pages: pages.ok ? group(pages.data.rows ?? [], (r) => pathOf(r.keys![0])).slice(0, 10) : [],
    days: days.ok ? (days.data.rows ?? []).map((r) => ({ date: r.keys![0], clicks: r.clicks, impressions: r.impressions })) : [],
    sitemap: sm
      ? {
          path: sm.path,
          lastRead: sm.lastDownloaded ?? null,
          errors: Number(sm.errors) || 0,
          warnings: Number(sm.warnings) || 0,
          pages: (sm.contents ?? []).reduce((n, c) => n + (Number(c.submitted) || 0), 0),
        }
      : null,
  };
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 40) cache.delete(cache.keys().next().value!);
  return value;
}

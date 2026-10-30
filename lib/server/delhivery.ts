import "server-only";

// Delhivery B2C: the one place every Delhivery call goes through, ported from the Minimalstoys backend.
// Field names follow Delhivery's spec exactly.
//
//   DELIVERY_API_TOKEN          One Panel → Settings → API Setup. Sent as `Token <token>`, not Bearer.
//   DELHIVERY_BASE_URL          https://track.delhivery.com (production, the default)
//                               https://staging-express.delhivery.com (staging: needs the staging token)
//   DELHIVERY_PICKUP_LOCATION   the warehouse name registered in the Delhivery panel, spelled exactly
//   DELHIVERY_ORIGIN_PIN        the warehouse PIN code, for delivery-time estimates and charges
//
// Every function returns { ok, ... } and never throws, so a Delhivery outage can't fail a checkout or an
// admin page. Staging only knows a small set of test PIN codes, so it can say "not serviceable" for real ones.

const BASE_URL = () => (process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com").replace(/\/$/, "");
const TOKEN = () => process.env.DELIVERY_API_TOKEN || process.env.DELHIVERY_API_TOKEN || "";

export const delhiveryConfigured = () => !!TOKEN();
export const pickupLocation = () => process.env.DELHIVERY_PICKUP_LOCATION || "TATTV";
export const originPin = () => process.env.DELHIVERY_ORIGIN_PIN || "500001";
export const delhiveryTrackUrl = (waybill: string) => `https://www.delhivery.com/track-v2/package/${encodeURIComponent(waybill)}`;

type Fail = { ok: false; reason: string };
const pin6 = (v: unknown) => String(v || "").replace(/\D/g, "");
const log = (label: string, extra = "") => console.log(`[DELHIVERY] ${label}${extra ? " | " + extra : ""}`);

async function dhRequest(path: string, { method = "GET", query, body, headers = {}, timeoutMs = 15_000 }: { method?: string; query?: Record<string, unknown>; body?: string; headers?: Record<string, string>; timeoutMs?: number } = {}) {
  const url = new URL(BASE_URL() + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v != null && v !== "") url.searchParams.set(k, String(v));
  const t0 = Date.now();
  const res = await fetch(url, { method, headers: { Authorization: `Token ${TOKEN()}`, Accept: "application/json", ...headers }, body, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  log(`${method} ${path}`, `status=${res.status} | ${Date.now() - t0}ms${res.ok ? "" : ` | ${text.slice(0, 200)}`}`);
  return { ok: res.ok, status: res.status, data: data as any }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** A refusal comes back as a body mapping the failed check to a sentence; pull the sentences out. */
export function delhiveryMessage(data: unknown): string {
  if (data == null) return "";
  if (typeof data === "string") return data.trim().slice(0, 300);
  if (Array.isArray(data)) return data.map(delhiveryMessage).filter(Boolean).join(" ");
  if (typeof data === "object") return Object.values(data).map((v) => (typeof v === "boolean" || typeof v === "number" ? "" : delhiveryMessage(v))).filter(Boolean).join(" ");
  return "";
}

/** What a refusal means for whoever runs the admin, in one sentence. */
export function explainDelhivery(said: string) {
  const s = String(said || "").toLowerCase();
  if (!s) return "Delhivery refused the request without giving a reason.";
  if (s === "network_error") return "Could not reach Delhivery. Check the connection and try again in a minute.";
  if (/balance|insufficient|recharge|wallet/.test(s)) return "The Delhivery wallet is too low. Recharge it in the Delhivery panel and try again.";
  if (/clientwarehouse matching query does not exist|invalid pickup location/.test(s)) return "Delhivery does not recognise the pickup location. DELHIVERY_PICKUP_LOCATION must match the warehouse name in their panel exactly.";
  if (/non serviceable pincode|not serviceable/.test(s)) return "Delhivery does not deliver to this PIN code.";
  if (/incorrect phone/.test(s)) return "Delhivery rejected the customer's phone number.";
  if (/duplicate order|duplicate waybill/.test(s)) return "Delhivery already has a shipment for this order.";
  if (/suspicious/.test(s)) return "Delhivery flagged this customer as suspicious (often a test name or a made-up phone number).";
  if (/^api_error_(401|403)$/.test(s) || /authentication credentials/.test(s)) return "Delhivery rejected the API token. Check DELIVERY_API_TOKEN (staging and production tokens differ).";
  if (/^api_error_5\d\d$/.test(s)) return "Delhivery is having a problem on their side. Try again in a few minutes.";
  return `Delhivery refused the request: ${said}`;
}

// ── PIN code serviceability: GET /c/api/pin-codes/json/?filter_codes=<pin> ──
export async function checkServiceability(pincode: string): Promise<{ ok: true; serviceable: boolean; cod: boolean; reason: string } | (Fail & { serviceable: false })> {
  const pin = pin6(pincode);
  if (!/^\d{6}$/.test(pin)) return { ok: false, serviceable: false, reason: "invalid_pincode" };
  try {
    const { ok, status, data } = await dhRequest("/c/api/pin-codes/json/", { query: { filter_codes: pin } });
    if (!ok) return { ok: false, serviceable: false, reason: `api_error_${status}` };
    const raw = data?.delivery_codes?.[0]?.postal_code;
    if (!raw) return { ok: true, serviceable: false, cod: false, reason: "non_serviceable" };
    const pc = Array.isArray(raw) ? raw[0] || {} : raw;
    const remark = pc.remarks ?? pc.remark ?? "";
    // "Embargo" (or any remark) means they are not taking parcels there now.
    return { ok: true, serviceable: remark === "", cod: pc.cod === "Y" || pc.cod === true, reason: remark === "" ? "serviceable" : String(remark) };
  } catch {
    return { ok: false, serviceable: false, reason: "network_error" };
  }
}

// ── Expected transit days: GET /api/dc/expected_tat (mot S = surface) ──
export async function expectedTat(destinationPin: string): Promise<{ ok: true; days: number | null } | Fail> {
  const d = pin6(destinationPin);
  try {
    const { ok, status, data } = await dhRequest("/api/dc/expected_tat", { query: { origin_pin: originPin(), destination_pin: d, mot: "S", pdt: "B2C" }, timeoutMs: 8_000 });
    if (ok && data?.success) return { ok: true, days: data.data?.tat ?? null };
    return { ok: false, reason: data?.msg || `api_error_${status}` };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

// ── Shipping charge: GET /api/kinko/v1/invoice/charges/.json (what Delhivery bills TATTV; grams) ──
export async function getShippingCost({ destPin, grams, codAmount = 0 }: { destPin: string; grams: number; codAmount?: number }): Promise<{ ok: true; total: number } | Fail> {
  try {
    const { ok, status, data } = await dhRequest("/api/kinko/v1/invoice/charges/.json", {
      query: { md: "S", cgm: Math.round(grams), o_pin: originPin(), d_pin: pin6(destPin), ss: "Delivered", pt: codAmount > 0 ? "COD" : "Pre-paid", cod: codAmount },
      timeoutMs: 8_000,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (!ok || !row) return { ok: false, reason: delhiveryMessage(data) || `api_error_${status}` };
    return { ok: true, total: Number(row.total_amount) || 0 };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

// ── Waybill: GET /waybill/api/fetch/json/?count=1 ──
export async function fetchWaybill(): Promise<{ ok: true; waybill: string } | Fail> {
  try {
    const { ok, status, data } = await dhRequest("/waybill/api/fetch/json/", { query: { count: 1 } });
    if (!ok) return { ok: false, reason: delhiveryMessage(data) || `api_error_${status}` };
    // One waybill comes back as a bare string; several as a comma-separated string or a list.
    const list = Array.isArray(data?.waybill_response) ? data.waybill_response : Array.isArray(data) ? data : String(data || "").split(",");
    const waybill = String(list[0] || "").trim();
    return waybill ? { ok: true, waybill } : { ok: false, reason: "no_waybill_returned" };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

// ── Create shipment: POST /api/cmu/create.json (form-encoded format=json&data=<json>) ──
export async function createShipment(shipment: Record<string, unknown>): Promise<{ ok: true; waybill: string } | Fail> {
  try {
    const payload = JSON.stringify({ shipments: [shipment], pickup_location: { name: pickupLocation() } });
    const { ok, status, data } = await dhRequest("/api/cmu/create.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `format=json&data=${encodeURIComponent(payload)}`,
    });
    if (!ok) return { ok: false, reason: delhiveryMessage(data) || `api_error_${status}` };
    // HTTP 200 even when the shipment is refused: the reason is in rmk or the package remarks.
    const pkg = data?.packages?.[0];
    if (!pkg) return { ok: false, reason: data?.rmk || "no_package_in_response" };
    if (pkg.status !== "Success") return { ok: false, reason: delhiveryMessage(pkg.remarks) || pkg.status };
    return { ok: true, waybill: String(pkg.waybill) };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

// ── Cancel shipment: POST /api/p/edit with a flat body { waybill, cancellation } ──
export async function cancelShipment(waybill: string): Promise<{ ok: true } | Fail> {
  try {
    const { ok, status, data } = await dhRequest("/api/p/edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ waybill, cancellation: "true" }) });
    if (!ok || data?.status !== true) return { ok: false, reason: delhiveryMessage(data?.error || data?.remark) || `api_error_${status}` };
    return { ok: true };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

export interface Scan {
  at: string;
  status: string;
  location: string;
  note: string;
}

// ── Track: GET /api/v1/packages/json/?waybill=<wbn> ──
export async function trackShipment(waybill: string): Promise<{ ok: true; status: string; location: string; at: string; scans: Scan[] } | Fail> {
  try {
    const { ok, status, data } = await dhRequest("/api/v1/packages/json/", { query: { waybill } });
    if (!ok) return { ok: false, reason: `api_error_${status}` };
    const pkg = data?.ShipmentData?.[0]?.Shipment;
    if (!pkg) return { ok: false, reason: "not_found" };
    return {
      ok: true,
      status: pkg.Status?.Status || "",
      location: pkg.Status?.StatusLocation || "",
      at: pkg.Status?.StatusDateTime || "",
      scans: (pkg.Scans || [])
        .map(({ ScanDetail: s = {} }: { ScanDetail?: Record<string, string> }) => ({ at: s.ScanDateTime || s.StatusDateTime || "", status: s.Scan || "", location: s.ScannedLocation || "", note: s.Instructions || "" }))
        .filter((s: Scan) => s.status)
        .slice(-40),
    };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

// ── Label: GET /api/p/packing_slip?wbns=<wbn>&pdf=true&pdf_size=4R ──
// pdf_size is needed in practice: without it the 4x6 label lands in a corner of an A4 page.
export async function fetchLabel(waybill: string): Promise<{ ok: true; pdf?: Buffer; link?: string } | Fail> {
  const size = ["4R", "A4"].includes(String(process.env.DELHIVERY_LABEL_SIZE).toUpperCase()) ? String(process.env.DELHIVERY_LABEL_SIZE).toUpperCase() : "4R";
  try {
    const res = await fetch(`${BASE_URL()}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&pdf=true&pdf_size=${size}`, {
      headers: { Authorization: `Token ${TOKEN()}`, Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, reason: `api_error_${res.status}` };
    // Some accounts get the PDF bytes, others JSON with a pre-signed link to it.
    if ((res.headers.get("content-type") || "").includes("pdf")) return { ok: true, pdf: Buffer.from(await res.arrayBuffer()) };
    const data = await res.json().catch(() => null);
    const link = data?.packages?.[0]?.pdf_download_link;
    return link ? { ok: true, link } : { ok: false, reason: "no_label_returned" };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

// ── Can we deliver to this PIN code? (checkout) ──
// Cached for 6 hours: the answer barely changes. An outage, or no token, never blocks an order.
const cache = new Map<string, { at: number; result: DeliveryCheck }>();
export interface DeliveryCheck {
  serviceable: boolean;
  cod: boolean;
  days: number | null;
  /** False when Delhivery wasn't asked (no token, or it couldn't be reached). */
  checked: boolean;
}

export async function deliveryCheck(pin: string): Promise<DeliveryCheck> {
  const p = pin6(pin);
  if (!/^\d{6}$/.test(p)) return { serviceable: false, cod: false, days: null, checked: true };
  if (!delhiveryConfigured()) return { serviceable: true, cod: true, days: null, checked: false };
  const hit = cache.get(p);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit.result;
  const [svc, tat] = await Promise.all([checkServiceability(p), expectedTat(p)]);
  if (!svc.ok) return { serviceable: true, cod: true, days: null, checked: false };
  const result = { serviceable: svc.serviceable, cod: svc.cod, days: tat.ok ? tat.days : null, checked: true };
  cache.set(p, { at: Date.now(), result });
  if (cache.size > 5000) cache.delete(cache.keys().next().value!);
  return result;
}

import "server-only";
import crypto from "node:crypto";
import { OrderError } from "@/lib/pricing";
import { query, transaction } from "./db";
import { invalidateCatalog, loadCatalogData } from "./catalog";

// Delivery set-up, edited in Admin → Delivery (ported from the Minimalstoys backend):
//   pickup addresses  the places Delhivery collects parcels from (Delhivery "warehouses"; the name must match
//                     their panel). One is the default: every shipment is booked from it.
//   parcel settings   packaging grams, a safety margin and fragile handling, added to each piece's packed weight.

export interface PickupAddress {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  isDefault: boolean;
  registeredAt: string | null;
  /** True for the starting address built from environment variables, before any is saved. */
  unsaved?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- raw rows */
const toAddress = (r: any): PickupAddress => ({
  id: r.id,
  name: r.name,
  contact: r.contact,
  phone: r.phone,
  address: r.address,
  city: r.city,
  state: r.state,
  pin: r.pin,
  isDefault: r.is_default,
  registeredAt: r.registered_at ? new Date(r.registered_at).toISOString() : null,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Until the admin saves one: the warehouse named in DELHIVERY_PICKUP_LOCATION, at the studio address. */
async function starting(): Promise<PickupAddress> {
  const { settings } = await loadCatalogData();
  const lines = settings.address.split("\n");
  return {
    id: "env",
    name: process.env.DELHIVERY_PICKUP_LOCATION || "TATTV",
    contact: "TATTV",
    phone: settings.phone.replace(/\D/g, "").slice(-10),
    address: lines[0] || "",
    city: "Hyderabad",
    state: "Telangana",
    pin: process.env.DELHIVERY_ORIGIN_PIN || "500001",
    isDefault: true,
    registeredAt: null,
    unsaved: true,
  };
}

export async function listPickupAddresses(): Promise<PickupAddress[]> {
  const r = await query("SELECT * FROM pickup_addresses ORDER BY is_default DESC, created_at");
  if (!r.rowCount) return [await starting()];
  const list = r.rows.map(toAddress);
  if (!list.some((a) => a.isDefault)) list[0].isDefault = true;
  return list;
}

export async function defaultPickup() {
  return (await listPickupAddresses())[0];
}

export async function savePickupAddress(input: Record<string, unknown>) {
  const s = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
  const a = {
    name: s(input.name, 60),
    contact: s(input.contact, 60) || "TATTV",
    phone: s(input.phone).replace(/\D/g, "").slice(-10),
    address: s(input.address, 200),
    city: s(input.city, 60),
    state: s(input.state, 60),
    pin: s(input.pin).replace(/\D/g, ""),
  };
  if (!a.name) throw new OrderError("Give the pickup address a name (the warehouse name in Delhivery).");
  if (!a.address || !a.city || !a.state) throw new OrderError("Fill in the address, city and state.");
  if (!/^\d{6}$/.test(a.pin)) throw new OrderError("The PIN code should be 6 digits.");
  if (!/^\d{10}$/.test(a.phone)) throw new OrderError("The phone number should be 10 digits.");
  const id = s(input.id);
  await transaction(async (db) => {
    const clash = await db.query("SELECT 1 FROM pickup_addresses WHERE lower(name) = lower($1) AND id <> $2", [a.name, id]);
    if (clash.rowCount) throw new OrderError("Another pickup address already has that name.");
    const values = [a.name, a.contact, a.phone, a.address, a.city, a.state, a.pin];
    if (id && id !== "env") {
      const r = await db.query("UPDATE pickup_addresses SET name=$2, contact=$3, phone=$4, address=$5, city=$6, state=$7, pin=$8 WHERE id=$1", [id, ...values]);
      if (!r.rowCount) throw new OrderError("That pickup address is gone. Refresh the page.");
    } else {
      const n = (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM pickup_addresses")).rows[0].n;
      if (n >= 10) throw new OrderError("You can keep up to 10 pickup addresses.");
      await db.query("INSERT INTO pickup_addresses (id, name, contact, phone, address, city, state, pin, is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [
        "p_" + crypto.randomBytes(4).toString("hex"),
        ...values,
        n === 0,
      ]);
    }
  });
}

export async function setDefaultPickup(id: string) {
  const r = await query("UPDATE pickup_addresses SET is_default = (id = $1) WHERE EXISTS (SELECT 1 FROM pickup_addresses WHERE id = $1)", [id]);
  if (!r.rowCount) throw new OrderError("That pickup address is gone. Refresh the page.");
}

export async function deletePickupAddress(id: string) {
  const r = await query<{ is_default: boolean }>("SELECT is_default FROM pickup_addresses WHERE id = $1", [id]);
  if (r.rows[0]?.is_default) throw new OrderError("This is the default pickup address. Make another one the default first.");
  await query("DELETE FROM pickup_addresses WHERE id = $1", [id]);
}

export async function markRegistered(id: string) {
  await query("UPDATE pickup_addresses SET registered_at = now() WHERE id = $1", [id]);
}

// ── Parcel weight ──
// Delhivery bills on weight and re-weighs every parcel at its hub; if their scale reads more than declared,
// they charge the difference and a penalty. So we declare each piece's packed weight + packaging + a margin.
export interface ParcelSettings {
  packagingGrams: number;
  marginGrams: number;
  /** Used for a piece with no packed weight yet. */
  fallbackGrams: number;
  fragile: boolean;
}
export const PARCEL_DEFAULTS: ParcelSettings = { packagingGrams: 120, marginGrams: 30, fallbackGrams: 100, fragile: false };

export async function getParcelSettings(): Promise<ParcelSettings> {
  const r = await query<{ value: Partial<ParcelSettings> }>("SELECT value FROM settings WHERE key = 'parcel'");
  return { ...PARCEL_DEFAULTS, ...(r.rows[0]?.value ?? {}) };
}

export async function saveParcelSettings(input: Record<string, unknown>) {
  const whole = (v: unknown, label: string, min: number, max: number) => {
    const n = Math.round(Number(v));
    if (!(n >= min && n <= max)) throw new OrderError(`${label} must be between ${min} and ${max} grams.`);
    return n;
  };
  const value: ParcelSettings = {
    packagingGrams: whole(input.packagingGrams, "Packaging weight", 0, 10_000),
    marginGrams: whole(input.marginGrams, "Extra margin", 0, 2_000),
    fallbackGrams: whole(input.fallbackGrams, "Weight for a piece not yet weighed", 1, 20_000),
    fragile: input.fragile === true || input.fragile === "on",
  };
  await query("INSERT INTO settings (key, value) VALUES ('parcel', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()", [JSON.stringify(value)]);
}

/** Packed weight by product, in grams (admin only). */
export async function loadWeights(): Promise<Map<string, number>> {
  const r = await query<{ slug: string; weight_grams: number }>("SELECT slug, weight_grams FROM products WHERE weight_grams IS NOT NULL");
  return new Map(r.rows.map((x) => [x.slug, x.weight_grams]));
}

/** Saves packed weights from Admin → Delivery (empty = not weighed yet). */
export async function saveWeights(rows: { slug: string; grams: unknown }[]) {
  await transaction(async (db) => {
    for (const r of rows) {
      const g = r.grams === "" || r.grams == null ? null : Math.round(Number(r.grams));
      if (g != null && !(g > 0 && g <= 20_000)) throw new OrderError("Each weight must be between 1 and 20,000 grams (or empty).");
      await db.query("UPDATE products SET weight_grams = $2 WHERE slug = $1", [r.slug, g]);
    }
  });
  invalidateCatalog();
}

/** This order's declared parcel weight: each piece's packed weight × quantity, plus packaging and margin. */
export async function weighLines(lines: { slug: string; name: string; qty: number }[]) {
  const [settings, weights] = await Promise.all([getParcelSettings(), loadWeights()]);
  const missing: string[] = [];
  let pieces = 0;
  for (const l of lines) {
    const g = weights.get(l.slug);
    if (g) pieces += g * l.qty;
    else {
      pieces += settings.fallbackGrams * l.qty;
      missing.push(l.name);
    }
  }
  return { pieces, packaging: settings.packagingGrams, margin: settings.marginGrams, total: Math.max(1, pieces + settings.packagingGrams + settings.marginGrams), missing, fragile: settings.fragile };
}

// ── Pickup requests ──
export interface PickupRequest {
  id: string;
  date: string;
  time: string;
  count: number;
  location: string;
  delhiveryId: string | null;
  orders: { id: string; waybill: string }[];
  requestedAt: string;
}

export async function recordPickup(p: Omit<PickupRequest, "id" | "requestedAt">) {
  await query("INSERT INTO pickups (id, pickup_date, pickup_time, count, location, delhivery_id, orders) VALUES ($1,$2,$3,$4,$5,$6,$7)", [
    "pu_" + Date.now().toString(36),
    p.date,
    p.time,
    p.count,
    p.location,
    p.delhiveryId,
    JSON.stringify(p.orders),
  ]);
}

export async function listPickups(limit = 15): Promise<PickupRequest[]> {
  const r = await query("SELECT * FROM pickups ORDER BY requested_at DESC LIMIT $1", [limit]);
  return r.rows.map((x) => ({
    id: x.id,
    date: new Date(x.pickup_date).toLocaleDateString("en-CA"),
    time: x.pickup_time,
    count: x.count,
    location: x.location,
    delhiveryId: x.delhivery_id,
    orders: x.orders,
    requestedAt: new Date(x.requested_at).toISOString(),
  }));
}

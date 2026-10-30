import "server-only";
import { OrderError } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/site";
import { cashDue } from "@/lib/site";
import { query } from "./db";
import { loadCatalogData } from "./catalog";
import { adminUpdateOrder, getOrder, type Order, type Shipment } from "./orders";
import { cancelShipment, createPickupRequest, createShipment, delhiveryConfigured, delhiveryTrackUrl, explainDelhivery, fetchLabel, fetchWaybill, getShippingCost, registerWarehouse, trackShipment } from "./delhivery";
import { defaultPickup, listPickupAddresses, markRegistered, recordPickup, weighLines } from "./pickup";

// Delhivery shipments for orders (ported from the Minimalstoys backend). The admin books one from the order
// page; Delhivery's scans (pushed to /api/delhivery/webhook, or fetched with "Refresh tracking") then move the
// order on: shipped → out for delivery → delivered. Booking never changes the order's status by itself:
// the piece still has to be packed. The parcel goes from the default pickup address, with the weight
// worked out from Admin → Delivery (each piece's packed weight + packaging + margin) unless the admin types one.
export const activeShipment = (o: Pick<Order, "shipment">) => (o.shipment?.state === "booked" && o.shipment.waybill ? o.shipment : null);


const blank = (): Shipment => ({ carrier: "delhivery", state: "failed", waybill: null, grams: null, cod: 0, cost: null, bookedAt: null, error: null, lastStatus: null, lastLocation: null, lastScanAt: null, checkedAt: null, scans: [] });

async function writeShipment(id: string, s: Shipment) {
  await query("UPDATE orders SET shipment = $2 WHERE id = $1", [id, JSON.stringify(s)]);
}

const inFlight = new Set<string>();

/** Books the parcel with Delhivery and fills in the order's tracking. `grams`: the weighed parcel, or the worked-out weight. */
export async function bookShipment(id: string, gramsInput?: unknown) {
  if (!delhiveryConfigured()) throw new OrderError("Delhivery is not set up yet. Add DELIVERY_API_TOKEN and DELHIVERY_PICKUP_LOCATION on the server.");
  const typed = gramsInput === "" || gramsInput == null ? null : Math.round(Number(gramsInput));
  if (typed != null && !(typed > 0 && typed <= 50_000)) throw new OrderError("Parcel weight must be between 1 and 50,000 grams.");
  if (inFlight.has(id)) throw new OrderError("This order is being booked right now. Refresh in a few seconds.");
  inFlight.add(id);
  try {
    const o = await getOrder(id);
    if (!o) throw new OrderError("Order not found", 404);
    if (activeShipment(o)) throw new OrderError(`Already booked: waybill ${o.shipment!.waybill}.`);
    if (["pending_payment", "cancelled", "delivered"].includes(o.status)) throw new OrderError("Only confirmed orders that are not yet delivered can be shipped.");
    const weight = await weighLines(o.lines);
    const grams = typed ?? weight.total;
    const from = await defaultPickup();
    const fail = async (reason: string) => {
      const msg = explainDelhivery(reason);
      await writeShipment(id, { ...(o.shipment ?? blank()), state: "failed", error: msg });
      throw new OrderError(msg);
    };

    const wb = await fetchWaybill();
    if (!wb.ok) return fail(wb.reason);
    const c = o.customer;
    const due = cashDue(o);
    const { settings } = await loadCatalogData();
    const res = await createShipment({
      waybill: wb.waybill,
      name: `${c.firstName} ${c.lastName}`.trim(),
      add: [c.address, c.apartment].filter(Boolean).join(", "),
      city: c.city,
      state: c.state,
      country: "India",
      pin: c.pin,
      phone: c.phone,
      order: o.id,
      payment_mode: due > 0 ? "COD" : "Pre-paid",
      cod_amount: due,
      total_amount: String(o.total),
      products_desc: o.lines.map((l) => `${l.name} x${l.qty}`).join(", ").slice(0, 200) || "Jewellery",
      quantity: String(o.lines.reduce((s, l) => s + l.qty, 0) || 1),
      hsn_code: "7117", // imitation jewellery
      order_date: o.createdAt.slice(0, 10),
      seller_name: from.contact || "TATTV",
      seller_add: [from.address, from.city].filter(Boolean).join(", ") || settings.address.replace(/\n/g, ", "),
      seller_inv: o.id,
      return_name: from.contact,
      return_add: from.address,
      return_city: from.city,
      return_state: from.state,
      return_pin: from.pin,
      return_country: "India",
      return_phone: from.phone,
      weight: grams,
      shipment_length: 15,
      shipment_width: 12,
      shipment_height: 6,
      shipping_mode: "Surface",
      address_type: "home",
      ...(weight.fragile ? { fragile_shipment: true } : {}),
    }, from.name);
    if (!res.ok) return fail(res.reason);
    const quote = await getShippingCost({ destPin: c.pin, grams, codAmount: due, fromPin: from.pin }).catch(() => null);

    await writeShipment(id, {
      ...blank(),
      state: "booked",
      waybill: res.waybill,
      grams,
      cod: due,
      cost: quote?.ok && quote.total > 0 ? Math.round(quote.total) : null,
      bookedAt: new Date().toISOString(),
    });
    await adminUpdateOrder(id, {
      tracking: { courier: "Delhivery", number: res.waybill, url: delhiveryTrackUrl(res.waybill) },
      note: `Delhivery shipment booked from ${from.name}: ${res.waybill}${due ? ` (COD ₹${due})` : " (prepaid)"}, ${grams} g${weight.fragile ? ", fragile" : ""}${!typed && weight.missing.length ? `. Not weighed yet: ${weight.missing.join(", ")}` : ""}`,
    });
    console.log(`[SHIPMENT] booked | order=${id} | waybill=${res.waybill} | cod=${due}`);
    return res.waybill;
  } finally {
    inFlight.delete(id);
  }
}

/** Calls off the Delhivery booking (before pickup) and clears the order's tracking. */
export async function cancelBooking(id: string) {
  const o = await getOrder(id);
  const s = o && activeShipment(o);
  if (!s) throw new OrderError("There is no live Delhivery booking on this order.");
  const r = await cancelShipment(s.waybill!);
  if (!r.ok) throw new OrderError(explainDelhivery(r.reason));
  await writeShipment(id, { ...s, state: "cancelled" });
  await adminUpdateOrder(id, { tracking: {}, note: `Delhivery shipment ${s.waybill} cancelled` });
}

// Delhivery's status → our order status. Only ever moves an order forward.
const FROM_DELHIVERY: Record<string, OrderStatus> = { "in transit": "shipped", pending: "shipped", dispatched: "out_for_delivery", delivered: "delivered" };
const FORWARD: OrderStatus[] = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

/** Asks Delhivery where the parcel is, keeps the scans, and moves the order on when it has moved. */
export async function refreshTracking(id: string) {
  const o = await getOrder(id);
  const s = o && activeShipment(o);
  if (!o || !s) throw new OrderError("There is no live Delhivery booking on this order.");
  const t = await trackShipment(s.waybill!);
  if (!t.ok) throw new OrderError(t.reason === "not_found" ? "Delhivery has no scans for this parcel yet." : explainDelhivery(t.reason));
  await writeShipment(id, { ...s, lastStatus: t.status, lastLocation: t.location, lastScanAt: t.at || null, checkedAt: new Date().toISOString(), scans: t.scans });
  const next = FROM_DELHIVERY[t.status.trim().toLowerCase()];
  if (next && FORWARD.indexOf(next) > FORWARD.indexOf(o.status) && FORWARD.includes(o.status)) {
    await adminUpdateOrder(id, { status: next, statusNote: `Delhivery: ${t.status}${t.location ? `, ${t.location}` : ""}` });
  }
  return { status: t.status, location: t.location };
}

/** The order holding this waybill (for the webhook). */
export async function orderForWaybill(waybill: string) {
  const r = await query<{ id: string }>("SELECT id FROM orders WHERE shipment->>'waybill' = $1 AND shipment->>'state' = 'booked' LIMIT 1", [waybill]);
  return r.rows[0]?.id ?? null;
}

/** Every parcel still on its way, for the background check. */
export async function refreshAllInTransit() {
  const r = await query<{ id: string }>("SELECT id FROM orders WHERE shipment->>'state' = 'booked' AND status IN ('confirmed', 'packed', 'shipped', 'out_for_delivery')");
  let moved = 0;
  for (const { id } of r.rows) {
    await refreshTracking(id).then(() => moved++, () => {});
  }
  return { checked: r.rows.length, moved };
}

export async function labelFor(id: string) {
  const o = await getOrder(id);
  const s = o && activeShipment(o);
  if (!s) throw new OrderError("There is no live Delhivery booking on this order.");
  const r = await fetchLabel(s.waybill!);
  if (!r.ok) throw new OrderError(explainDelhivery(r.reason));
  return r;
}


// ── Pickups ──
/** Parcels booked but not collected yet. */
export const awaitingPickup = (orders: Order[]) =>
  orders.filter((o) => activeShipment(o) && ["confirmed", "packed"].includes(o.status) && (!o.shipment!.lastStatus || /^(manifested|not picked|pending pickup)/i.test(o.shipment!.lastStatus)));

/** Asks Delhivery to collect the day's parcels from a pickup address (one request a day per address). */
export async function requestPickup({ date, time, count, from: fromId, orders }: { date: string; time: string; count: unknown; from: string; orders: Order[] }) {
  if (!delhiveryConfigured()) throw new OrderError("Delhivery is not set up yet.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new OrderError("Pick a pickup date.");
  const list = await listPickupAddresses();
  const from = list.find((a) => a.id === fromId) ?? list[0];
  const n = Math.max(1, Math.min(100, Math.round(Number(count)) || 1));
  const t = /^\d{2}:\d{2}$/.test(time) ? time : "14:00";
  const r = await createPickupRequest({ date, time: t, count: n, location: from.name });
  if (!r.ok) throw new OrderError(explainDelhivery(r.reason));
  await recordPickup({ date, time: t, count: n, location: from.name, delhiveryId: r.id, orders: orders.map((o) => ({ id: o.id, waybill: o.shipment?.waybill ?? "" })) });
  return { id: r.id, location: from.name };
}

/** Registers a pickup address with Delhivery (or updates the one they have under that name). */
export async function registerPickup(id: string) {
  if (!delhiveryConfigured()) throw new OrderError("Delhivery is not set up yet.");
  const a = (await listPickupAddresses()).find((x) => x.id === id);
  if (!a || a.unsaved) throw new OrderError("Save this pickup address first, then register it.");
  const { settings } = await loadCatalogData();
  const r = await registerWarehouse({ name: a.name, phone: a.phone, email: settings.email, address: a.address, city: a.city, state: a.state, pin: a.pin });
  if (!r.ok) throw new OrderError(explainDelhivery(r.reason));
  await markRegistered(id);
  return { name: a.name, existed: r.existed };
}

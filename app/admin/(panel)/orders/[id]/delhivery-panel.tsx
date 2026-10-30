"use client";

import { useActionState } from "react";
import type { Shipment } from "@/lib/server/orders";
import { bookShipmentAction, shipmentAction } from "../../../actions";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

/** Book the parcel with Delhivery, print its label, follow its scans, or cancel the booking. */
export function DelhiveryPanel({ id, shipment, configured, canBook, defaultGrams, cod }: { id: string; shipment: Shipment | null; configured: boolean; canBook: boolean; defaultGrams: number; cod: number }) {
  const [booked, book, booking] = useActionState(bookShipmentAction, null);
  const [state, act, acting] = useActionState(shipmentAction, null);
  const live = shipment?.state === "booked" && shipment.waybill ? shipment : null;
  const msg = state ?? booked;

  return (
    <section className="adm-card space-y-4">
      <div>
        <h2 className="adm-h2 !mb-1">Delhivery</h2>
        {!configured && <p className="text-xs text-muted">Not set up yet: add DELIVERY_API_TOKEN and DELHIVERY_PICKUP_LOCATION on the server. Until then, add tracking by hand below.</p>}
      </div>

      {configured && live && (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Waybill</dt>
              <dd className="font-medium">{live.waybill}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Payment</dt>
              <dd>{live.cod ? `COD ₹${live.cod.toLocaleString("en-IN")}` : "Prepaid"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Weight</dt>
              <dd>{live.grams} g</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Delhivery charge</dt>
              <dd>{live.cost != null ? `₹${live.cost.toLocaleString("en-IN")}` : "–"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted">Latest scan</dt>
              <dd>
                {live.lastStatus ? `${live.lastStatus}${live.lastLocation ? `, ${live.lastLocation}` : ""} · ${when(live.lastScanAt)}` : "No scans yet (waiting for pickup)"}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/admin/label/${id}`} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm">
              Print Label
            </a>
            <form action={act}>
              <input type="hidden" name="id" value={id} />
              <button name="do" value="refresh" className="btn btn-outline btn-sm" disabled={acting}>
                {acting ? "…" : "Refresh Tracking"}
              </button>
            </form>
            <form
              action={act}
              onSubmit={(e) => {
                if (!confirm(`Cancel Delhivery waybill ${live.waybill}? Only before the parcel is picked up.`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={id} />
              <button name="do" value="cancel" className="btn btn-sm border border-red-700 text-red-700 hover:bg-red-700 hover:text-white" disabled={acting}>
                Cancel Booking
              </button>
            </form>
          </div>
          {live.scans.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted">All scans ({live.scans.length})</summary>
              <ol className="mt-2 space-y-1.5">
                {[...live.scans].reverse().map((s, i) => (
                  <li key={i}>
                    <b className="font-medium">{s.status}</b> · {s.location} <span className="text-muted">· {when(s.at)}</span>
                    {s.note && <span className="block text-muted">{s.note}</span>}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </>
      )}

      {configured && !live && (
        <form action={book} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          {shipment?.state === "failed" && shipment.error && <p className="adm-error">Last try: {shipment.error}</p>}
          {shipment?.state === "cancelled" && <p className="text-xs text-muted">Booking {shipment.waybill} was cancelled. You can book again.</p>}
          <div className="grid grid-cols-2 items-end gap-3">
            <div>
              <label htmlFor="d-grams" className="adm-label">
                Parcel weight (g)
              </label>
              <input id="d-grams" name="grams" type="number" min="1" max="50000" placeholder={String(defaultGrams)} className="adm-input" />
            </div>
            <p className="pb-2 text-xs text-muted">{cod ? `Courier collects ₹${cod.toLocaleString("en-IN")} (COD)` : "Prepaid: nothing to collect"}</p>
          </div>
          <button className="btn btn-dark btn-sm" disabled={booking || !canBook}>
            {booking ? "Booking…" : "Book Delhivery Shipment"}
          </button>
          {!canBook && <p className="text-xs text-muted">Only confirmed orders that are not delivered or cancelled can be booked.</p>}
          <p className="text-xs text-muted">Empty weight uses {defaultGrams} g, worked out from Delivery → Parcel weight. Booking fills in the tracking below; Delhivery&apos;s scans then move the order to Shipped, Out for delivery and Delivered.</p>
        </form>
      )}

      {msg?.ok && (
        <p role="status" className="adm-ok">
          {msg.ok}
        </p>
      )}
      {msg?.error && (
        <p role="alert" className="adm-error">
          {msg.error}
        </p>
      )}
    </section>
  );
}

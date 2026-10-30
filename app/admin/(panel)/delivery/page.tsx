import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { loadCatalogData } from "@/lib/server/catalog";
import { delhiveryConfigured, delhiveryStaging, delhiveryTrackUrl } from "@/lib/server/delhivery";
import { listOrders, type Order } from "@/lib/server/orders";
import { getParcelSettings, listPickupAddresses, listPickups, loadWeights, type PickupAddress } from "@/lib/server/pickup";
import { activeShipment, awaitingPickup } from "@/lib/server/shipments";
import {
  defaultPickupAction,
  deletePickupAddressAction,
  refreshAllTrackingAction,
  registerPickupAction,
  requestPickupAction,
  saveParcelSettingsAction,
  savePickupAddressAction,
  saveWeightsAction,
} from "../../actions";
import { PageHead, StatusPill, when } from "../ui";

export const metadata = { title: "Delivery" };
export const dynamic = "force-dynamic";

// A date in India time, as YYYY-MM-DD for the date picker.
const istDate = (offsetDays = 0) => new Date(Date.now() + 5.5 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);
const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** Admin → Delivery: Delhivery status, pickups, parcels on their way, pickup addresses and parcel weights. */
export default async function DeliveryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [orders, places, pickups, parcel, weights, { products }] = await Promise.all([
    listOrders(),
    listPickupAddresses(),
    listPickups(),
    getParcelSettings(),
    loadWeights(),
    loadCatalogData(),
  ]);
  const ready = delhiveryConfigured();
  const home = places.find((a) => a.isDefault) ?? places[0];
  const moving = orders.filter((o) => activeShipment(o) && !["delivered", "cancelled"].includes(o.status));
  const failed = orders.filter((o) => o.shipment?.state === "failed" && !["delivered", "cancelled", "pending_payment"].includes(o.status));
  const toBook = orders.filter((o) => ["confirmed", "packed"].includes(o.status) && !activeShipment(o));
  const waiting = awaitingPickup(orders);
  const done = orders.filter((o) => o.shipment?.waybill && (["delivered", "cancelled"].includes(o.status) || o.shipment.state === "cancelled")).slice(0, 30);
  const unweighed = products.filter((p) => !weights.has(p.slug));

  return (
    <>
      <PageHead
        title={
          <>
            Delivery{" "}
            {ready ? <span className={`pill ${delhiveryStaging() ? "pill-packed" : "pill-delivered"}`}>{delhiveryStaging() ? "Delhivery staging (test)" : "Delhivery live"}</span> : <span className="pill pill-hidden">Not connected</span>}
          </>
        }
        sub="Book parcels from each order's page; here you schedule pickups, follow parcels, and set the pickup addresses and parcel weights."
      >
        {ready && (
          <form action={refreshAllTrackingAction}>
            <button className="btn btn-outline btn-sm">Update All Tracking</button>
          </form>
        )}
      </PageHead>
      {sp.note && <p className="adm-ok">{sp.note}</p>}
      {sp.err && <p className="adm-error">{sp.err}</p>}
      {!ready && <p className="adm-note">Delhivery isn&apos;t connected. Add DELIVERY_API_TOKEN on the server; until then checkout accepts every PIN code and tracking is added by hand on each order.</p>}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["To book", toBook.length, "/admin/orders?status=confirmed"],
          ["Waiting for pickup", waiting.length, null],
          ["On their way", moving.length, null],
          ["Couldn't book", failed.length, null],
        ].map(([label, n, href]) => {
          const body = (
            <>
              <p className={`text-3xl font-semibold tracking-tight ${n ? "text-ink" : "text-ink/30"}`}>{n}</p>
              <p className="mt-1 text-xs text-muted">{label}</p>
            </>
          );
          return href ? (
            <Link key={String(label)} href={String(href)} className="rounded-3xl border border-line bg-white p-5 shadow-soft transition-shadow hover:shadow-lift">
              {body}
            </Link>
          ) : (
            <div key={String(label)} className="rounded-3xl border border-line bg-white p-5 shadow-soft">
              {body}
            </div>
          );
        })}
      </section>

      {failed.length > 0 && (
        <section className="adm-card overflow-x-auto !p-0">
          <h2 className="adm-h2 px-6 pt-5">Couldn&apos;t book ({failed.length})</h2>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>What Delhivery said</th>
              </tr>
            </thead>
            <tbody>
              {failed.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">
                      {o.id}
                    </Link>
                    <span className="block text-xs text-muted">
                      {o.customer.city} {o.customer.pin}
                    </span>
                  </td>
                  <td className="text-sm">{o.shipment!.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-6 pb-5 text-xs text-muted">Fix the cause (address, wallet, pickup address), then book again from the order&apos;s page.</p>
        </section>
      )}

      <section className="adm-card space-y-4">
        <h2 className="adm-h2 !mb-0">Schedule a pickup</h2>
        {waiting.length ? (
          <div>
            <p className="text-sm">
              {waiting.length} parcel{waiting.length === 1 ? " is" : "s are"} waiting for Delhivery to collect:
            </p>
            <p className="mt-2 flex flex-wrap gap-2">
              {waiting.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="adm-chip">
                  {o.id} · {o.shipment!.waybill}
                </Link>
              ))}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">No parcels are waiting for a pickup.</p>
        )}
        {ready && (
          <form action={requestPickupAction} className="flex flex-wrap items-end gap-3">
            {places.length > 1 && (
              <label className="grid gap-1 text-xs">
                <span className="text-muted">From</span>
                <select name="from" defaultValue={home.id} className="adm-input !h-10 !w-auto">
                  {places.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {places.length <= 1 && <input type="hidden" name="from" value={home.id} />}
            <label className="grid gap-1 text-xs">
              <span className="text-muted">Date</span>
              <input type="date" name="date" defaultValue={istDate(1)} min={istDate(0)} required className="adm-input !h-10 !w-auto" />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-muted">From time</span>
              <input type="time" name="time" defaultValue="14:00" className="adm-input !h-10 !w-auto" />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-muted">Parcels</span>
              <input type="number" name="count" defaultValue={Math.max(1, waiting.length)} min={1} max={100} className="adm-input !h-10 !w-24" />
            </label>
            <button className="btn btn-dark btn-sm">Request Pickup</button>
          </form>
        )}
        <p className="text-xs text-muted">Delhivery allows one pickup a day per address: book the day&apos;s parcels first, then request one pickup for all of them. A pickup can only be cancelled in the Delhivery panel.</p>
      </section>

      <section className="adm-card overflow-x-auto !p-0">
        <h2 className="adm-h2 px-6 pt-5">On their way ({moving.length})</h2>
        {moving.length === 0 ? <p className="px-6 pb-6 text-sm text-muted">Nothing on its way right now.</p> : <ShipmentTable list={moving} />}
      </section>

      {pickups.length > 0 && (
        <section className="adm-card overflow-x-auto !p-0">
          <h2 className="adm-h2 px-6 pt-5">Pickup requests</h2>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Pickup on</th>
                <th>From</th>
                <th>Parcels</th>
                <th className="hidden md:table-cell">Delhivery pickup ID</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b className="font-medium">{day(p.date)}</b>
                    <span className="block text-xs text-muted">from {p.time} · asked {when(p.requestedAt)}</span>
                  </td>
                  <td className="text-sm">{p.location}</td>
                  <td>
                    {p.count}
                    {p.orders.length > 0 && <span className="block text-xs text-muted">{p.orders.map((x) => x.id).join(", ")}</span>}
                  </td>
                  <td className="hidden md:table-cell">{p.delhiveryId ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="adm-card space-y-4">
        <div>
          <h2 className="adm-h2 !mb-1">Pickup addresses</h2>
          <p className="text-xs text-muted">
            Where Delhivery collects parcels from. New shipments are booked from the <b className="font-medium">default</b> one, and checkout&apos;s delivery-time estimate counts from its PIN code. The name must match the
            warehouse name in the Delhivery panel; press Register with Delhivery once for each new address (Delhivery may take a day to switch it on).
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {places.map((a) => (
            <li key={a.id} className={`rounded-3xl border p-5 ${a.isDefault ? "border-ink" : "border-line"}`}>
              <p className="flex flex-wrap items-center gap-2">
                <b className="font-medium">{a.name}</b>
                {a.isDefault && <span className="pill pill-confirmed">Default</span>}
                {a.registeredAt && <span className="pill pill-delivered">Registered</span>}
                {a.unsaved && <span className="pill pill-hidden">From server settings</span>}
              </p>
              <p className="mt-2 text-sm text-ink/75">
                {a.contact} · {a.phone}
                <br />
                {a.address || <span className="text-muted">(no street address yet)</span>}, {a.city}, {a.state} {a.pin}
              </p>
              {a.unsaved && <p className="mt-2 text-xs text-muted">Fill in and save the real details below to keep this address and register it.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {ready && !a.unsaved && (
                  <form action={registerPickupAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="btn btn-outline btn-sm">Register with Delhivery</button>
                  </form>
                )}
                {!a.isDefault && (
                  <form action={defaultPickupAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="btn btn-outline btn-sm">Make Default</button>
                  </form>
                )}
                {!a.isDefault && (
                  <form action={deletePickupAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-[11px] uppercase tracking-[0.12em] text-red-700 underline underline-offset-2">Delete</button>
                  </form>
                )}
              </div>
              <details className="mt-3" open={a.unsaved}>
                <summary className="cursor-pointer text-xs uppercase tracking-[0.14em] text-muted hover:text-ink">Edit</summary>
                <PickupFields a={a} />
              </details>
            </li>
          ))}
        </ul>
        {!places[0].unsaved && (
          <details className="rounded-3xl border border-dashed border-ink/25 p-5">
            <summary className="cursor-pointer text-sm font-medium">+ Add a pickup address</summary>
            <PickupFields />
          </details>
        )}
      </section>

      <section className="adm-card space-y-4">
        <div>
          <h2 className="adm-h2 !mb-1">Parcel weight &amp; handling</h2>
          <p className="text-xs text-muted">
            Delhivery bills on weight and re-weighs every parcel at its hub; if their scale reads more than we declared, they charge the difference and a penalty. So each booking declares{" "}
            <b className="font-medium">each piece&apos;s packed weight</b> + <b className="font-medium">the packaging</b> + <b className="font-medium">a margin</b>.
          </p>
        </div>
        <form action={saveParcelSettingsAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="pk" className="adm-label">
              Packaging (g)
            </label>
            <input id="pk" name="packagingGrams" type="number" min="0" max="10000" defaultValue={parcel.packagingGrams} required className="adm-input" />
            <p className="mt-1 text-xs text-muted">Box, pouch and padding with nothing inside.</p>
          </div>
          <div>
            <label htmlFor="mg" className="adm-label">
              Extra margin (g)
            </label>
            <input id="mg" name="marginGrams" type="number" min="0" max="2000" defaultValue={parcel.marginGrams} required className="adm-input" />
            <p className="mt-1 text-xs text-muted">So the hub scale never reads above us.</p>
          </div>
          <div>
            <label htmlFor="fb" className="adm-label">
              Piece not yet weighed (g)
            </label>
            <input id="fb" name="fallbackGrams" type="number" min="1" max="20000" defaultValue={parcel.fallbackGrams} required className="adm-input" />
            <p className="mt-1 text-xs text-muted">Used for any piece below with no weight.</p>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-line p-3.5 text-sm">
            <input type="checkbox" name="fragile" defaultChecked={parcel.fragile} className="mt-0.5 size-4 accent-ink" />
            <span>
              <span className="block font-medium">Fragile</span>
              <span className="text-xs text-muted">Ask Delhivery to handle every parcel with care.</span>
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-4">
            <button className="btn btn-dark btn-sm">Save</button>
            <p className="text-xs text-muted">
              Example: 2 pieces of 60 g + {parcel.packagingGrams} g packaging + {parcel.marginGrams} g margin = <b className="font-medium">{120 + parcel.packagingGrams + parcel.marginGrams} g</b>. Applies to shipments booked from now on.
            </p>
          </div>
        </form>

        <details className="rounded-3xl border border-line" open={unweighed.length > 0}>
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium">
            Each piece&apos;s packed weight {unweighed.length > 0 && <span className="pill pill-packed ml-2">{unweighed.length} not weighed</span>}
          </summary>
          <form action={saveWeightsAction}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="w-40 text-right">Packed weight (g)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.slug}>
                    <td>
                      <input type="hidden" name="slug" value={p.slug} />
                      {p.name}
                      {p.active === false && <span className="pill pill-hidden ml-2">Hidden</span>}
                    </td>
                    <td className="text-right">
                      <input name={`w:${p.slug}`} type="number" min="1" max="20000" defaultValue={weights.get(p.slug) ?? ""} placeholder={`${parcel.fallbackGrams}`} aria-label={`Packed weight of ${p.name}`} className="adm-input !h-9 !w-28 text-right" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4">
              <button className="btn btn-dark btn-sm">Save Weights</button>
            </div>
          </form>
        </details>
      </section>

      {ready && (
        <section className="adm-card space-y-2 text-sm">
          <h2 className="adm-h2 !mb-1">Tracking updates</h2>
          <p className="text-ink/75">
            Every 30 minutes the server asks Delhivery about parcels on their way and moves orders on (Shipped → Out for delivery → Delivered).
            {process.env.DELHIVERY_WEBHOOK_TOKEN
              ? " For updates the moment a parcel is scanned, ask Delhivery's tech team to push scans to:"
              : " For instant updates, set DELHIVERY_WEBHOOK_TOKEN on the server and ask Delhivery to push scans to this site."}
          </p>
          {process.env.DELHIVERY_WEBHOOK_TOKEN && <code className="block break-all rounded-2xl bg-sand px-4 py-3 text-xs">{SITE_URL}/api/delhivery/webhook?token=•••• (the DELHIVERY_WEBHOOK_TOKEN value)</code>}
        </section>
      )}

      {done.length > 0 && (
        <details className="adm-card overflow-x-auto !p-0">
          <summary className="cursor-pointer px-6 py-5 text-sm font-medium">
            Delivered and cancelled <span className="text-muted">(last {done.length})</span>
          </summary>
          <ShipmentTable list={done} />
        </details>
      )}
    </>
  );
}

function ShipmentTable({ list }: { list: Order[] }) {
  return (
    <table className="adm-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Waybill</th>
          <th className="hidden md:table-cell">Collect</th>
          <th>Latest scan</th>
        </tr>
      </thead>
      <tbody>
        {list.map((o) => {
          const s = o.shipment!;
          return (
            <tr key={o.id}>
              <td>
                <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">
                  {o.id}
                </Link>{" "}
                <StatusPill status={o.status} />
                <span className="block text-xs text-muted">
                  {o.customer.firstName} {o.customer.lastName} · {o.customer.city} {o.customer.pin}
                </span>
              </td>
              <td>
                {s.waybill}
                <span className="block text-xs text-muted">
                  {s.bookedAt && `Booked ${when(s.bookedAt)} · `}
                  <a href={delhiveryTrackUrl(s.waybill!)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    Track
                  </a>{" "}
                  ·{" "}
                  <a href={`/api/admin/label/${o.id}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    Label
                  </a>
                </span>
              </td>
              <td className="hidden md:table-cell">{s.cod ? <b className="font-medium">{formatPrice(s.cod)} COD</b> : "Prepaid"}</td>
              <td className="text-sm">
                {s.state === "cancelled" ? (
                  <span className="text-muted">Booking cancelled</span>
                ) : s.lastStatus ? (
                  <>
                    {s.lastStatus}
                    {s.lastLocation && <span className="text-muted"> · {s.lastLocation}</span>}
                    {s.lastScanAt && <span className="block text-xs text-muted">{new Date(s.lastScanAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>}
                  </>
                ) : (
                  <span className="text-muted">No scans yet</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** The fields of one pickup address: blank to add one, filled in to edit it. */
function PickupFields({ a }: { a?: PickupAddress }) {
  const id = a?.id ?? "new";
  const f = (name: keyof PickupAddress, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`p${name}-${id}`} className="adm-label">
        {label}
      </label>
      <input id={`p${name}-${id}`} name={name} defaultValue={a ? String(a[name] ?? "") : ""} required className="adm-input" {...props} />
    </div>
  );
  return (
    <form action={savePickupAddressAction} className="mt-3 grid gap-3 sm:grid-cols-2">
      {a && !a.unsaved && <input type="hidden" name="id" value={a.id} />}
      {f("name", "Name in Delhivery", { maxLength: 60, placeholder: "TATTV Hyderabad" })}
      {f("contact", "Contact name", { maxLength: 60, placeholder: "TATTV" })}
      {f("phone", "Phone", { inputMode: "numeric", maxLength: 10 })}
      {f("pin", "PIN code", { inputMode: "numeric", maxLength: 6 })}
      <div className="sm:col-span-2">{f("address", "Address", { maxLength: 200 })}</div>
      {f("city", "City", { maxLength: 60 })}
      {f("state", "State", { maxLength: 60 })}
      <div className="sm:col-span-2">
        <button className="btn btn-dark btn-sm">{a && !a.unsaved ? "Save" : "Add Pickup Address"}</button>
      </div>
    </form>
  );
}

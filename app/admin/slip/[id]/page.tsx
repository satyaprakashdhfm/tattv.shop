import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/orders";
import { formatPrice } from "@/lib/format";
import { PAYMENT_LABELS } from "@/lib/site";
import { loadCatalogData } from "@/lib/server/catalog";
import { PrintButton } from "./print-button";

export const metadata = { title: "Packing slip" };

/** A printable slip to tuck into the parcel (and to copy the address from). */
export default async function Slip({ params }: { params: Promise<{ id: string }> }) {
  const { settings } = await loadCatalogData();
  await requireAdmin();
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) notFound();
  const c = o.customer;
  const cod = o.payment.status === "cod_due";

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-sm print:rounded-none print:p-0">
      <PrintButton />
      <header className="flex items-start justify-between border-b border-ink pb-5">
        <Image src="/brand/logo-black.png" alt="TATTV" width={1147} height={294} className="h-auto w-[140px]" />
        <p className="text-right">
          <b className="font-medium">Order {o.id}</b>
          <br />
          {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-8 py-6">
        <div>
          <h2 className="adm-label">Ship to</h2>
          <p className="leading-relaxed">
            <b className="font-medium">
              {c.firstName} {c.lastName}
            </b>
            <br />
            {c.address}
            <br />
            {c.apartment && (
              <>
                {c.apartment}
                <br />
              </>
            )}
            {c.city}, {c.state} – {c.pin}
            <br />
            Phone: +91 {c.phone}
          </p>
        </div>
        <div>
          <h2 className="adm-label">From</h2>
          <p className="leading-relaxed">
            <b className="font-medium">TATTV</b>
            <br />
            {settings.email}
            <br />
            {settings.phone}
          </p>
          {cod ? <p className="mt-3 rounded-xl border-2 border-ink p-2 font-semibold">CASH ON DELIVERY: {formatPrice(o.total)}</p> : <p className="mt-3">Payment: {PAYMENT_LABELS[o.payment.status]}</p>}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-ink text-left text-[10px] uppercase tracking-[0.14em]">
            <th className="py-2">Item</th>
            <th className="py-2">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {o.lines.map((l) => (
            <tr key={`${l.slug}|${l.size}`} className="border-b border-line">
              <td className="py-2">
                {l.name}
                {l.size && <span className="text-muted"> · {l.size}</span>}
              </td>
              <td className="py-2">{l.qty}</td>
              <td className="py-2 text-right">{formatPrice(l.price)}</td>
              <td className="py-2 text-right">{formatPrice(l.price * l.qty)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-3 text-right">
              Subtotal
            </td>
            <td className="pt-3 text-right">{formatPrice(o.subtotal)}</td>
          </tr>
          {o.discount > 0 && (
            <tr>
              <td colSpan={3} className="text-right">
                Discount ({o.discountCode})
              </td>
              <td className="text-right">−{formatPrice(o.discount)}</td>
            </tr>
          )}
          <tr>
            <td colSpan={3} className="text-right">
              Shipping
            </td>
            <td className="text-right">{o.shipping ? formatPrice(o.shipping) : "Free"}</td>
          </tr>
          <tr className="font-semibold">
            <td colSpan={3} className="pt-2 text-right">
              Total
            </td>
            <td className="pt-2 text-right">{formatPrice(o.total)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-10 border-t border-line pt-5 text-center text-xs uppercase tracking-[0.2em] text-muted">Thank you for choosing TATTV · Energize Your Style Element</p>
    </div>
  );
}

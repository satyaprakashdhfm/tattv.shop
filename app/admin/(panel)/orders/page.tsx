import Link from "next/link";
import { ClickRow } from "../click-row";
import { formatPrice } from "@/lib/format";
import { PAYMENT_LABELS, type PaymentStatus } from "@/lib/site";
import { listOrders, type Order } from "@/lib/server/orders";
import { PageHead, StatusPill } from "../ui";

export const metadata = { title: "Orders" };

const TABS: [string, string][] = [
  ["active", "Needs action"],
  ["confirmed", "To pack"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
  ["pending_payment", "Unpaid checkouts"],
  ["all", "All"],
];

const matchesTab = (o: Order, tab: string) => {
  if (tab === "all") return true;
  if (tab === "active") return ["confirmed", "packed"].includes(o.status);
  if (tab === "shipped") return ["shipped", "out_for_delivery"].includes(o.status);
  return o.status === tab;
};

const short = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const tab = sp.status || "active";
  const q = (sp.q || "").trim().toLowerCase();
  const all = await listOrders();
  const counts = Object.fromEntries(TABS.map(([k]) => [k, all.filter((o) => matchesTab(o, k)).length]));

  const orders = all.filter((o) => {
    if (!matchesTab(o, tab)) return false;
    if (sp.pay && o.payment.status !== sp.pay) return false;
    if (!q) return true;
    const c = o.customer;
    return [o.id, c.firstName, c.lastName, c.email, c.phone, c.city, c.pin].join(" ").toLowerCase().includes(q);
  });

  return (
    <>
      <PageHead title="Orders">
        <a href="/api/admin/export" className="btn btn-outline btn-sm">
          Download CSV
        </a>
      </PageHead>

      <nav aria-label="Order status" className="adm-chips">
        {TABS.map(([k, label]) => {
          const active = tab === k && !sp.pay;
          return (
            <Link
              key={k}
              href={`/admin/orders?status=${k}`}
              aria-current={active ? "page" : undefined}
              className="adm-chip"
            >
              {label} <span className="adm-chip-n">{counts[k]}</span>
            </Link>
          );
        })}
      </nav>

      <form role="search" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="status" value={tab} />
        <input name="q" defaultValue={sp.q || ""} placeholder="Search order no., name, phone, email, pincode…" aria-label="Search orders" className="adm-input max-w-md flex-1" />
        <button className="btn btn-dark btn-sm">Search</button>
        {(q || sp.pay) && (
          <Link href={`/admin/orders?status=${tab}`} className="text-[11px] uppercase tracking-[0.16em] text-muted underline underline-offset-4">
            Clear
          </Link>
        )}
      </form>
      {sp.pay && (
        <p className="adm-note">
          Showing orders with payment: <b className="font-medium">{PAYMENT_LABELS[sp.pay as PaymentStatus]}</b>
        </p>
      )}

      <div className="adm-card overflow-x-auto !p-0">
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-muted">No orders here.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th className="hidden lg:table-cell">Items</th>
                <th className="hidden md:table-cell">Payment</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <ClickRow key={o.id} href={`/admin/orders/${o.id}`}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">
                      {o.id}
                    </Link>
                    <span className="block text-xs text-muted">{short(o.createdAt)}</span>
                  </td>
                  <td>
                    {o.customer.firstName} {o.customer.lastName}
                    <span className="block text-xs text-muted">
                      {o.customer.city} · {o.customer.phone}
                    </span>
                  </td>
                  <td className="hidden max-w-xs text-xs lg:table-cell">{o.lines.map((l) => `${l.qty}× ${l.name}${l.size ? ` (${l.size})` : ""}`).join(", ")}</td>
                  <td className="hidden md:table-cell">
                    {o.payment.method === "cod" ? "COD" : o.payment.method === "demo" ? "Demo" : "Online"}
                    <span className="block text-xs text-muted">{PAYMENT_LABELS[o.payment.status]}</span>
                  </td>
                  <td>
                    <StatusPill status={o.status} />
                  </td>
                  <td className="text-right font-medium">{formatPrice(o.total)}</td>
                </ClickRow>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

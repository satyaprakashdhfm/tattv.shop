import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { customersFrom, listOrders } from "@/lib/server/orders";
import { listCoupons } from "@/lib/server/coupons";
import { PageHead } from "../ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = ((await searchParams).q || "").trim().toLowerCase();
  const [orders, coupons] = await Promise.all([listOrders(), listCoupons()]);
  const all = customersFrom(orders);
  // Codes linked to a customer, by their email or mobile.
  const personal = coupons.filter((c) => c.ownerEmail || c.ownerPhone);
  const codesOf = (email: string, phone: string) => personal.filter((c) => c.ownerEmail === email || c.ownerPhone === phone);
  const customers = q ? all.filter((c) => [c.name, c.email, c.phone, c.city].join(" ").toLowerCase().includes(q)) : all;
  const repeat = all.filter((c) => c.orders > 1).length;

  return (
    <>
      <PageHead title="Customers" sub={`${all.length} customers · ${repeat} ordered more than once`} />
      <form role="search" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone, city…" aria-label="Search customers" className="adm-input max-w-md flex-1" />
        <button className="btn btn-dark btn-sm">Search</button>
      </form>
      <div className="adm-card overflow-x-auto !p-0">
        {customers.length === 0 ? (
          <p className="p-6 text-sm text-muted">No customers yet.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th className="hidden md:table-cell">Location</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Spent</th>
                <th className="hidden md:table-cell">Last order</th>
                <th>Coupons</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td>
                    <Link href={`/admin/orders?status=all&q=${encodeURIComponent(c.email)}`} className="font-medium underline-offset-2 hover:underline">
                      {c.name}
                    </Link>
                    <span className="block text-xs text-muted">
                      {c.email} · {c.phone}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">{c.city}</td>
                  <td className="text-right">{c.orders}</td>
                  <td className="text-right">{formatPrice(c.spent)}</td>
                  <td className="hidden md:table-cell">{new Date(c.last).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                  <td>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {codesOf(c.email, c.phone).map((x) => (
                        <Link key={x.code} href={`/admin/coupons?edit=${x.code}`} className={`pill ${x.state === "on" ? "pill-delivered" : "pill-hidden"}`} title={`${x.label} · used ${x.used}`}>
                          {x.code}
                        </Link>
                      ))}
                      <Link
                        href={`/admin/coupons?edit=new&email=${encodeURIComponent(c.email)}&phone=${encodeURIComponent(c.phone)}`}
                        className="whitespace-nowrap text-[11px] uppercase tracking-[0.12em] text-muted underline underline-offset-2 hover:text-ink"
                      >
                        + Give coupon
                      </Link>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

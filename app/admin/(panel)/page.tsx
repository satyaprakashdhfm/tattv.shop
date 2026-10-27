import Link from "next/link";
import { ClickRow } from "./click-row";
import { CalendarDays, CalendarRange, IndianRupee, MessageSquare, Package, Truck, Wallet, Boxes } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { loadCatalogData } from "@/lib/server/catalog";
import { isLive, listMessages, listOrders, paymentConfig } from "@/lib/server/orders";
import { adminConfigured } from "@/lib/server/auth";
import { PageHead, StatusPill, when } from "./ui";

export const metadata = { title: "Dashboard" };

const DAY = 86400_000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export default async function Dashboard() {
  const [orders, messages, { products }] = await Promise.all([listOrders(), listMessages(), loadCatalogData()]);
  const live = orders.filter(isLive);
  const today = startOfDay(Date.now());
  const since = (days: number) => live.filter((o) => Date.parse(o.createdAt) >= today - (days - 1) * DAY);
  const sum = (list: typeof live) => list.reduce((s, o) => s + o.total, 0);

  const periods: [string, typeof live, typeof IndianRupee][] = [
    ["Today", since(1), IndianRupee],
    ["Last 7 days", since(7), CalendarDays],
    ["Last 30 days", since(30), CalendarRange],
  ];
  const newMessages = messages.filter((m) => m.status === "new").length;
  const queue: [string, string, number, typeof Package][] = [
    ["To pack", "/admin/orders?status=confirmed", live.filter((o) => o.status === "confirmed").length, Package],
    ["Packed, to ship", "/admin/orders?status=packed", live.filter((o) => o.status === "packed").length, Boxes],
    ["In transit", "/admin/orders?status=shipped", live.filter((o) => o.status === "shipped" || o.status === "out_for_delivery").length, Truck],
    ["Cash on delivery due", "/admin/orders?status=all&pay=cod_due", live.filter((o) => o.payment.status === "cod_due").length, Wallet],
    ["New messages", "/admin/messages", newMessages, MessageSquare],
  ];
  const unpaid = orders.filter((o) => o.status === "pending_payment" && Date.parse(o.createdAt) > Date.now() - 7 * DAY).length;

  // Revenue per day, last 14 days.
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = today - (13 - i) * DAY;
    const list = live.filter((o) => {
      const t = Date.parse(o.createdAt);
      return t >= start && t < start + DAY;
    });
    return { start, revenue: sum(list), orders: list.length };
  });
  const peak = Math.max(1, ...days.map((d) => d.revenue));

  // Units sold per piece, last 30 days.
  const units: Record<string, number> = {};
  for (const o of since(30)) for (const l of o.lines) units[l.slug] = (units[l.slug] || 0) + l.qty;
  const best = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const nameOf = (slug: string) => products.find((p) => p.slug === slug)?.name || slug;

  const low = products.filter((p) => p.stock != null && p.stock <= 5);
  const recent = orders.filter((o) => o.status !== "pending_payment").slice(0, 6);

  const pay = paymentConfig();
  const setup: [boolean, string][] = adminConfigured()
    ? [
        [true, "Orders, products and messages are saved in Postgres"],
        [pay.online === "razorpay", pay.online === "razorpay" ? "Razorpay online payments are on" : pay.online === "demo" ? "Online payments are in demo mode: add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET" : "Online payments are off (cash on delivery only): add Razorpay keys"],
        [!!process.env.ADMIN_PASSWORD, process.env.ADMIN_PASSWORD ? "Admin password is set" : "Set ADMIN_PASSWORD (and remove ADMIN_TEST_LOGIN) before launch"],
        [!!process.env.SESSION_SECRET, process.env.SESSION_SECRET ? "SESSION_SECRET is set" : "Set SESSION_SECRET (a long random string) so sign-ins stay valid if the admin password changes"],
      ]
    : [];

  return (
    <>
      <PageHead title="Dashboard">
        <a href="/api/admin/export" className="btn btn-outline btn-sm">
          Download Orders (CSV)
        </a>
      </PageHead>

      <section className="grid gap-4 sm:grid-cols-3">
        {periods.map(([label, list, Icon]) => (
          <div key={label} className="adm-card transition-shadow duration-300 hover:shadow-lift">
            <p className="flex items-center gap-3 text-sm text-muted">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-sand text-ink">
                <Icon size={18} strokeWidth={1.7} />
              </span>
              {label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{formatPrice(sum(list))}</p>
            <p className="mt-1 text-xs text-muted">
              {list.length} {list.length === 1 ? "order" : "orders"}
              {list.length ? ` · avg ${formatPrice(Math.round(sum(list) / list.length))}` : ""}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {queue.map(([label, href, n, Icon]) => (
          <Link
            key={label}
            href={href}
            className={`rounded-3xl border p-5 shadow-soft transition-[box-shadow,transform,background-color] duration-300 hover:-translate-y-0.5 hover:shadow-lift ${n ? "border-ink bg-ink text-white" : "border-line bg-white"}`}
          >
            <span className={`flex size-9 items-center justify-center rounded-xl ${n ? "bg-white/10" : "bg-sand"}`}>
              <Icon size={16} strokeWidth={1.7} />
            </span>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{n}</p>
            <p className={`mt-1 text-xs ${n ? "text-white/70" : "text-muted"}`}>{label}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="adm-card">
          <h2 className="adm-h2">Sales, last 14 days</h2>
          {/* Daily sales as bars on a baseline; hover (or tab to) a day for its takings and order count. */}
          <div className="mb-8 flex h-48 items-end gap-0.5 border-b border-line pt-2.5" role="img" aria-label={`Daily sales for the last 14 days, highest ${formatPrice(peak)}`}>
            {days.map((d) => {
              const label = new Date(d.start).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
              return (
                <div key={d.start} tabIndex={0} className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none">
                  <span className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus:opacity-100">
                    {label}: {formatPrice(d.revenue)} · {d.orders} {d.orders === 1 ? "order" : "orders"}
                  </span>
                  <span className="min-h-0.5 w-full max-w-7 rounded-t bg-ink/80 transition-colors duration-150 group-hover:bg-ink group-focus:bg-ink" style={{ height: `${(d.revenue / peak) * 100}%` }} />
                  <span className="absolute -bottom-[22px] text-[11px] text-muted">{new Date(d.start).getDate()}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted">
            Highest day: {formatPrice(peak === 1 ? 0 : peak)}. Cancelled and unpaid orders are not counted.
            {unpaid > 0 && ` ${unpaid} unpaid checkout${unpaid === 1 ? "" : "s"} this week.`}
          </p>
        </section>

        <section className="adm-card">
          <h2 className="adm-h2">Best sellers (30 days)</h2>
          {best.length === 0 ? (
            <p className="text-sm text-muted">No sales yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {best.map(([slug, n]) => (
                <li key={slug} className="flex justify-between py-2">
                  <span>{nameOf(slug)}</span>
                  <span>
                    <b className="font-medium">{n}</b> sold
                  </span>
                </li>
              ))}
            </ul>
          )}
          <h2 className="adm-h2 mt-6">Stock alerts</h2>
          {low.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing running low.{" "}
              <Link href="/admin/stock" className="underline underline-offset-2">
                Manage stock
              </Link>
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {low.map((p) => (
                <li key={p.slug}>
                  <Link href="/admin/stock" className="underline-offset-2 hover:underline">
                    {p.name}
                  </Link>{" "}
                  · {p.stock === 0 ? <b className="font-medium text-red-700">sold out</b> : `${p.stock} left`}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="adm-card overflow-hidden !p-0">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="adm-h2">Recent orders</h2>
          <Link href="/admin/orders" className="text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink">
            All orders →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted">No orders yet. They&apos;ll appear here as soon as a customer checks out.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="hidden md:table-cell">Placed</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <ClickRow key={o.id} href={`/admin/orders/${o.id}`}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">
                        {o.id}
                      </Link>
                    </td>
                    <td>
                      {o.customer.firstName} {o.customer.lastName}
                    </td>
                    <td className="hidden text-muted md:table-cell">{when(o.createdAt)}</td>
                    <td>
                      <StatusPill status={o.status} />
                    </td>
                    <td className="text-right">{formatPrice(o.total)}</td>
                  </ClickRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {setup.length > 0 && (
        <section className="adm-card">
          <h2 className="adm-h2">Store setup</h2>
          <ul className="space-y-2 text-sm">
            {setup.map(([ok, text]) => (
              <li key={text} className="flex items-start gap-3">
                <span aria-hidden className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] ${ok ? "bg-ink text-white" : "border border-amber-400 text-amber-700"}`}>
                  {ok ? "✓" : "!"}
                </span>
                {!ok && <span className="sr-only">To do: </span>}
                {text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

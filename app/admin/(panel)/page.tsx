import Link from "next/link";
import { ClickRow } from "./click-row";
import { ArrowDownRight, ArrowUpRight, Boxes, MessageSquare, Package, Truck, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { loadCatalogData } from "@/lib/server/catalog";
import { isLive, listMessages, listOrders, orderCosts, orderProfit, paymentConfig } from "@/lib/server/orders";
import { adminConfigured } from "@/lib/server/auth";
import { PageHead, StatusPill, when } from "./ui";

export const metadata = { title: "Dashboard" };

const DAY = 86400_000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** The dashboard's period filter (?range=…); 7 days by default, or ?range=custom&from=…&to=… for any dates. */
const RANGES = [
  { id: "today", days: 1, label: "Today" },
  { id: "7d", days: 7, label: "7 days" },
  { id: "30d", days: 30, label: "30 days" },
  { id: "90d", days: 90, label: "90 days" },
] as const;
const MAX_CUSTOM_DAYS = 366;

/** "2026-10-27" → that day's local midnight; anything else → null. */
const parseDay = (v?: string) => {
  const m = v?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const t = new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  return Number.isNaN(t) ? null : t;
};
const isoDay = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const shortDay = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const [orders, messages, { products }, costs] = await Promise.all([listOrders(), listMessages(), loadCatalogData(), orderCosts()]);
  const live = orders.filter(isLive);
  const today = startOfDay(Date.now());

  // The period: a preset ending today, or custom dates (swapped if reversed, never past today, at most a year).
  const custom = params.range === "custom";
  let end = today;
  let range: { id: string; days: number; label: string };
  if (custom) {
    let a = parseDay(params.from) ?? today - 29 * DAY;
    let b = Math.min(parseDay(params.to) ?? today, today);
    if (a > b) [a, b] = [b, a];
    a = Math.max(a, b - (MAX_CUSTOM_DAYS - 1) * DAY);
    end = b;
    range = { id: "custom", days: Math.round((b - a) / DAY) + 1, label: a === b ? shortDay(b) : `${shortDay(a)} – ${shortDay(b)}` };
  } else {
    range = RANGES.find((r) => r.id === params.range) ?? RANGES[1];
  }
  const between = (from: number, to: number) =>
    live.filter((o) => {
      const t = Date.parse(o.createdAt);
      return t >= from && t < to;
    });
  const sum = (list: typeof live) => list.reduce((s, o) => s + o.total, 0);
  const itemsIn = (list: typeof live) => list.reduce((n, o) => n + o.lines.reduce((m, l) => m + l.qty, 0), 0);

  // The chosen period, and the one just before it for comparison.
  const from = end - (range.days - 1) * DAY;
  const current = between(from, end + DAY);
  const previous = between(from - range.days * DAY, from);
  const stat = (now: number, before: number) => ({ now, change: before ? Math.round(((now - before) / before) * 100) : null });
  const avg = (list: typeof live) => (list.length ? Math.round(sum(list) / list.length) : 0);
  const profit = (list: typeof live) => list.reduce((s, o) => s + orderProfit(o, costs), 0);
  const noCost = current.reduce((n, o) => n + (costs.get(o.id)?.missing ?? 0), 0);
  const kpis = [
    { label: "Revenue", ...stat(sum(current), sum(previous)), money: true },
    { label: "Profit", ...stat(profit(current), profit(previous)), money: true },
    { label: "Orders", ...stat(current.length, previous.length), money: false },
    { label: "Average order", ...stat(avg(current), avg(previous)), money: true },
    { label: "Items sold", ...stat(itemsIn(current), itemsIn(previous)), money: false },
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

  // Revenue per day across the chosen period (at least a week, so a single day still has a shape).
  const chartDays = Math.max(7, range.days);
  const chartFrom = end - (chartDays - 1) * DAY;
  const days = Array.from({ length: chartDays }, (_, i) => {
    const start = chartFrom + i * DAY;
    const list = live.filter((o) => {
      const t = Date.parse(o.createdAt);
      return t >= start && t < start + DAY;
    });
    return { start, revenue: sum(list), orders: list.length };
  });
  const peak = Math.max(1, ...days.map((d) => d.revenue));

  // Units sold per piece in the chosen period.
  const units: Record<string, number> = {};
  for (const o of current) for (const l of o.lines) units[l.slug] = (units[l.slug] || 0) + l.qty;
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

      <section className="adm-card !p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <h2 className="adm-h2 !mb-0">Sales overview</h2>
          {/* Period filter: a quiet segmented control. */}
          <nav aria-label="Period" className="flex rounded-full bg-[#f1f1ef] p-1 text-xs">
            {[...RANGES, { id: "custom", label: "Custom" }].map((r) => (
              <Link
                key={r.id}
                href={r.id === "7d" ? "/admin" : `/admin?range=${r.id}`}
                scroll={false}
                aria-current={r.id === range.id ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-2.5 py-1.5 transition-colors sm:px-3.5 ${r.id === range.id ? "bg-white font-medium text-ink shadow-soft" : "text-ink/55 hover:text-ink"}`}
              >
                {r.label}
              </Link>
            ))}
          </nav>
        </div>
        {custom && (
          // A plain GET form: two dates, and the dashboard reloads for them.
          <form action="/admin" className="flex flex-wrap items-end gap-3 border-b border-line bg-[#fafaf9] px-6 py-4 text-xs">
            <input type="hidden" name="range" value="custom" />
            <label className="grid gap-1">
              <span className="text-muted">From</span>
              <input type="date" name="from" defaultValue={isoDay(from)} max={isoDay(today)} required className="adm-input !h-9 !w-auto !py-0" />
            </label>
            <label className="grid gap-1">
              <span className="text-muted">To</span>
              <input type="date" name="to" defaultValue={isoDay(end)} max={isoDay(today)} required className="adm-input !h-9 !w-auto !py-0" />
            </label>
            <button className="btn btn-dark btn-sm">Apply</button>
            <p className="basis-full text-muted sm:basis-auto">
              Showing {range.label} ({range.days} {range.days === 1 ? "day" : "days"}). Up to a year at a time.
            </p>
          </form>
        )}
        <dl className="grid grid-cols-2 divide-line md:grid-cols-5 md:divide-x">
          {kpis.map((k) => (
            <div key={k.label} className="px-6 py-5">
              <dt className="text-xs text-muted">{k.label}</dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight">{k.money ? formatPrice(k.now) : k.now}</dd>
              <dd className="mt-1 flex items-center gap-1 text-[11px] text-ink/50">
                {k.change === null ? (
                  "No earlier data"
                ) : (
                  <>
                    {k.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span className="font-medium text-ink/70">{Math.abs(k.change)}%</span> vs previous {range.days === 1 ? "day" : `${range.days} days`}
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
        {/* Profit = what the pieces sold for after discounts, less their cost price (shipping and gift packing left out). */}
        <p className="border-t border-line px-6 py-3 text-xs text-muted">
          Profit is the items&apos; selling price after discounts, less their cost price; shipping and gift packing are left out.
          {noCost > 0 && (
            <>
              {" "}
              {noCost} {noCost === 1 ? "piece" : "pieces"} sold in this period {noCost === 1 ? "has" : "have"} no cost price yet, so {noCost === 1 ? "it counts" : "they count"} as pure profit.{" "}
              <Link href="/admin/products" className="underline underline-offset-2">
                Add cost prices
              </Link>
            </>
          )}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {queue.map(([label, href, n, Icon]) => (
          <Link
            key={label}
            href={href}
            className="group rounded-3xl border border-line bg-white p-5 shadow-soft transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#f1f1ef] text-ink/60">
                <Icon size={16} strokeWidth={1.7} />
              </span>
              {n > 0 && <span className="size-2 rounded-full bg-ink/70" aria-label="Needs attention" />}
            </div>
            <p className={`mt-4 text-3xl font-semibold tracking-tight ${n ? "text-ink" : "text-ink/30"}`}>{n}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="adm-card">
          <h2 className="adm-h2">Sales, {end === today ? `last ${chartDays} days` : `${shortDay(chartFrom)} – ${shortDay(end)}`}</h2>
          {/* Daily sales as bars on a baseline; hover (or tab to) a day for its takings and order count. */}
          <div className="mb-8 flex h-48 items-end gap-0.5 border-b border-line pt-2.5" role="img" aria-label={`Daily sales for ${chartDays} days, highest ${formatPrice(peak)}`}>
            {days.map((d, i) => {
              const label = shortDay(d.start);
              // Tooltips near the ends open inward so they never spill past the card (or a phone screen).
              const edge = i < chartDays / 4 ? "left-0" : i >= (chartDays * 3) / 4 ? "right-0" : "left-1/2 -translate-x-1/2";
              return (
                <div key={d.start} tabIndex={0} className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none">
                  <span className={`pointer-events-none absolute bottom-[calc(100%+4px)] z-10 whitespace-nowrap ${edge} rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus:opacity-100`}>
                    {label}: {formatPrice(d.revenue)} · {d.orders} {d.orders === 1 ? "order" : "orders"}
                  </span>
                  <span
                    className={`min-h-0.5 w-full max-w-7 rounded-t transition-colors duration-150 group-hover:bg-ink/70 group-focus:bg-ink/70 ${d.start === today ? "bg-ink/45" : "bg-[#d9d9d6]"}`}
                    style={{ height: `${(d.revenue / peak) * 100}%` }}
                  />
                  {/* Every day labelled up to two weeks; beyond that, every few days. */}
                  {(chartDays <= 14 || i % Math.ceil(chartDays / 12) === 0 || d.start === end) && (
                    <span className="absolute -bottom-[22px] text-[11px] text-muted">{new Date(d.start).getDate()}</span>
                  )}
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
          <h2 className="adm-h2">Best sellers ({custom ? range.label : range.days === 1 ? "today" : `${range.days} days`})</h2>
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

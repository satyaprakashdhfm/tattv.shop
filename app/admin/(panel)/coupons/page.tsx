import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { offerName } from "@/lib/site";
import { couponOrders, listCoupons, type CouponState, type CouponWithUse } from "@/lib/server/coupons";
import { customersFrom, listOrders } from "@/lib/server/orders";
import { toggleCouponAction } from "../../actions";
import { ClickRow } from "../click-row";
import { Modal } from "../modal";
import { PageHead, StatusPill, when } from "../ui";
import { CouponForm } from "./coupon-form";

export const metadata = { title: "Coupons" };

const STATE: Record<CouponState, [label: string, pill: string]> = {
  on: ["On", "pill-delivered"],
  off: ["Off", "pill-hidden"],
  scheduled: ["Starts later", "pill-shipped"],
  ended: ["Ended", "pill-cancelled"],
  "used up": ["Used up", "pill-packed"],
};

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

/** The rules of a coupon in a few words, for the table. */
function rulesOf(c: CouponWithUse) {
  return [
    c.ownerEmail || c.ownerPhone ? `Only for ${[c.ownerEmail, c.ownerPhone && `+91 ${c.ownerPhone}`].filter(Boolean).join(" / ")}` : null,
    c.firstOrderOnly && "First order only",
    c.minSubtotal > 0 && `Bags of ${formatPrice(c.minSubtotal)}+`,
    c.perCustomer > 0 ? `${c.perCustomer}× per customer` : "No limit per customer",
    c.startsAt && `From ${day(c.startsAt)}`,
    c.expiresAt ? `Until ${day(c.expiresAt)}` : "No end date",
    !c.showAtCheckout && !c.ownerEmail && !c.ownerPhone && "Secret (not listed)",
  ].filter(Boolean) as string[];
}

export default async function CouponsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [coupons, orders] = await Promise.all([listCoupons(), listOrders()]);
  const customers = customersFrom(orders).map(({ name, email, phone }) => ({ name, email, phone }));
  const editing = sp.edit === "new" ? "new" : coupons.find((c) => c.code === sp.edit);
  const uses = editing && editing !== "new" ? await couponOrders(editing.code) : [];
  const listHref = "/admin/coupons";
  const used = coupons.reduce((s, c) => s + c.used, 0);
  const given = coupons.reduce((s, c) => s + c.given, 0);
  const sales = coupons.reduce((s, c) => s + c.sales, 0);

  return (
    <>
      <PageHead title="Coupons" sub="Discount codes customers type at checkout. Make one for everyone, or link it to one customer so only they can use it.">
        <Link href={`${listHref}?edit=new`} scroll={false} className="btn btn-dark btn-sm">
          + New Coupon
        </Link>
      </PageHead>
      {sp.deleted && <p className="adm-ok">Coupon deleted. Orders that used it keep their discount.</p>}
      {sp.saved && <p className="adm-ok">{sp.saved} saved. It works at checkout straight away.</p>}

      <section className="adm-card !p-0">
        <dl className="grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
          {[
            ["Coupons on", String(coupons.filter((c) => c.state === "on").length)],
            ["Times used", String(used)],
            ["Discount given", formatPrice(given)],
            ["Sales with a coupon", formatPrice(sales)],
          ].map(([label, value]) => (
            <div key={label} className="px-6 py-5">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="adm-card overflow-x-auto !p-0">
        {coupons.length === 0 ? (
          <p className="p-6 text-sm text-muted">No coupons yet. Make one: a code, the discount, and any rules.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th className="hidden md:table-cell">Rules</th>
                <th className="text-right">Used</th>
                <th className="hidden text-right md:table-cell">Discount given</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <ClickRow key={c.code} href={`${listHref}?edit=${c.code}`}>
                  <td>
                    <Link href={`${listHref}?edit=${c.code}`} scroll={false} className="font-semibold tracking-[0.06em] underline-offset-2 hover:underline">
                      {c.code}
                    </Link>
                    {(c.ownerEmail || c.ownerPhone) && <span className="pill pill-packed ml-2">Personal</span>}
                    <span className="block text-xs text-muted">
                      {offerName(c)} · {c.label}
                    </span>
                  </td>
                  <td className="hidden max-w-sm text-xs text-muted md:table-cell">{rulesOf(c).join(" · ")}</td>
                  <td className="text-right">
                    {c.used}
                    {c.maxUses ? <span className="text-muted"> / {c.maxUses}</span> : null}
                  </td>
                  <td className="hidden text-right md:table-cell">{formatPrice(c.given)}</td>
                  <td>
                    <form action={toggleCouponAction} className="flex items-center gap-2">
                      <input type="hidden" name="code" value={c.code} />
                      <input type="hidden" name="active" value={c.active ? "0" : "1"} />
                      <span className={`pill ${STATE[c.state][1]}`}>{STATE[c.state][0]}</span>
                      <button className="text-[11px] uppercase tracking-[0.12em] text-muted underline underline-offset-2 hover:text-ink">{c.active ? "Turn off" : "Turn on"}</button>
                    </form>
                  </td>
                </ClickRow>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-muted">Click a coupon to change its rules or see the orders that used it. A use counts once the order is placed; cancelled orders give the use back.</p>

      {editing && (
        <Modal
          closeHref={listHref}
          title={editing === "new" ? "New Coupon" : editing.code}
          sub={editing === "new" ? "It works at checkout as soon as you create it." : `${offerName(editing)} · used ${editing.used} ${editing.used === 1 ? "time" : "times"}`}
        >
          <CouponForm
            key={editing === "new" ? "new" : editing.code}
            coupon={editing === "new" ? undefined : editing}
            prefill={{ email: sp.email, phone: sp.phone }}
            customers={customers}
            returnTo={`${listHref}?edit=${editing === "new" ? "new" : editing.code}`}
          />
          {editing !== "new" && (
            <section className="adm-card overflow-x-auto !p-0">
              <h2 className="adm-h2 px-6 pt-5">Orders that used {editing.code}</h2>
              {uses.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted">Not used yet.</p>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th className="hidden md:table-cell">Placed</th>
                      <th>Status</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uses.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">
                            {o.id}
                          </Link>
                        </td>
                        <td>
                          {o.name}
                          <span className="block text-xs text-muted">{o.phone}</span>
                        </td>
                        <td className="hidden text-muted md:table-cell">{when(o.at)}</td>
                        <td>
                          <StatusPill status={o.status as never} />
                        </td>
                        <td className="text-right">−{formatPrice(o.discount)}</td>
                        <td className="text-right">{formatPrice(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </Modal>
      )}
    </>
  );
}

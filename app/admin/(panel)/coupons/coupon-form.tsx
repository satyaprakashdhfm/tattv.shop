"use client";

import { useActionState, useState } from "react";
import { deleteCouponAction, saveCouponAction } from "../../actions";

export interface CouponFormValues {
  code: string;
  kind: "percent" | "flat";
  value: number;
  label: string;
  active: boolean;
  showAtCheckout: boolean;
  firstOrderOnly: boolean;
  minSubtotal: number;
  maxUses: number;
  perCustomer: number;
  startsAt: string | null;
  expiresAt: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  note: string;
}

const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "");

function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-line p-3.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-ink" />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
}

/**
 * One coupon: the code and the discount, its rules, and (optionally) the one customer it belongs to.
 * `customers` fills the email / mobile suggestions so a code can be linked to someone who has ordered.
 */
export function CouponForm({
  coupon,
  prefill,
  customers,
  returnTo,
}: {
  coupon?: CouponFormValues;
  prefill?: { email?: string; phone?: string };
  customers: { name: string; email: string; phone: string }[];
  returnTo: string;
}) {
  const isNew = !coupon;
  const [state, action, pending] = useActionState(saveCouponAction, null);
  const [kind, setKind] = useState<"percent" | "flat">(coupon?.kind ?? "percent");

  return (
    <>
      <form action={action} className="grid items-start gap-6 lg:grid-cols-2">
        <input type="hidden" name="create" value={isNew ? "1" : "0"} />
        <input type="hidden" name="returnTo" value={returnTo} />

        <section className="adm-card space-y-4">
          <h2 className="adm-h2 !mb-0">The coupon</h2>
          <div>
            <label htmlFor="c-code" className="adm-label">
              Code *
            </label>
            {isNew ? (
              <input id="c-code" name="code" required maxLength={20} placeholder="DIWALI15" className="adm-input uppercase placeholder:normal-case" />
            ) : (
              <>
                <input id="c-code" value={coupon.code} readOnly className="adm-input bg-sand/50" />
                <input type="hidden" name="code" value={coupon.code} />
              </>
            )}
            <p className="mt-1 text-xs text-muted">Letters and numbers, no spaces. Customers type this at checkout.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="c-kind" className="adm-label">
                Discount type
              </label>
              <select id="c-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as "percent" | "flat")} className="adm-input">
                <option value="percent">% off the bag</option>
                <option value="flat">₹ off the bag</option>
              </select>
            </div>
            <div>
              <label htmlFor="c-value" className="adm-label">
                {kind === "percent" ? "Percent off *" : "Rupees off *"}
              </label>
              <input id="c-value" name="value" type="number" min="1" max={kind === "percent" ? 90 : undefined} step="1" required defaultValue={coupon?.value ?? 10} className="adm-input" />
            </div>
          </div>
          <div>
            <label htmlFor="c-label" className="adm-label">
              What customers see
            </label>
            <input id="c-label" name="label" maxLength={80} defaultValue={coupon?.label} placeholder="15% off for Diwali" className="adm-input" />
            <p className="mt-1 text-xs text-muted">Shown under the code at checkout. Leave empty and it is written for you.</p>
          </div>
          <Check name="active" label="On" hint="Untick to pause the code without deleting it." defaultChecked={coupon ? coupon.active : true} />
          <Check name="showAtCheckout" label="List it at checkout" hint="Shown under Offers & Coupons. Untick for a secret code you share yourself. Codes linked to a customer are never listed." defaultChecked={coupon ? coupon.showAtCheckout : true} />
        </section>

        <div className="space-y-6">
          <section className="adm-card space-y-4">
            <h2 className="adm-h2 !mb-0">Rules</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="c-min" className="adm-label">
                  Minimum bag (₹)
                </label>
                <input id="c-min" name="minSubtotal" type="number" min="0" step="1" defaultValue={coupon?.minSubtotal || ""} placeholder="No minimum" className="adm-input" />
              </div>
              <div>
                <label htmlFor="c-max" className="adm-label">
                  Total uses
                </label>
                <input id="c-max" name="maxUses" type="number" min="0" step="1" defaultValue={coupon?.maxUses || ""} placeholder="No limit" className="adm-input" />
              </div>
              <div>
                <label htmlFor="c-per" className="adm-label">
                  Uses per customer
                </label>
                <input id="c-per" name="perCustomer" type="number" min="0" step="1" defaultValue={coupon ? coupon.perCustomer : 1} className="adm-input" />
                <p className="mt-1 text-xs text-muted">0 means no limit.</p>
              </div>
              <div />
              <div>
                <label htmlFor="c-start" className="adm-label">
                  First day
                </label>
                <input id="c-start" name="startsOn" type="date" defaultValue={dayOf(coupon?.startsAt ?? null)} className="adm-input" />
              </div>
              <div>
                <label htmlFor="c-exp" className="adm-label">
                  Last day
                </label>
                <input id="c-exp" name="expiresOn" type="date" defaultValue={dayOf(coupon?.expiresAt ?? null)} className="adm-input" />
              </div>
              <p className="col-span-2 -mt-2 text-xs text-muted">Empty: no start or end date. Works until the end of the last day (India time).</p>
            </div>
            <Check name="firstOrderOnly" label="First order only" hint="Only for an email and mobile that have never ordered before." defaultChecked={!!coupon?.firstOrderOnly} />
          </section>

          <section className="adm-card space-y-4">
            <div>
              <h2 className="adm-h2 !mb-1">Link to one customer (optional)</h2>
              <p className="text-xs text-muted">
                Fill in a customer&apos;s mobile and only they can use this code: they must be signed in on the site with that number (checked with a login code), so it can&apos;t be used from another account even if it gets shared. It also shows in their account. Leave empty for everyone.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="c-ophone" className="adm-label">
                  Customer&apos;s mobile
                </label>
                <input id="c-ophone" name="ownerPhone" type="tel" inputMode="tel" list="c-phones" defaultValue={coupon?.ownerPhone ?? prefill?.phone ?? ""} placeholder="98xxxxxxxx" className="adm-input" />
                <datalist id="c-phones">
                  {customers.map((c) => (
                    <option key={c.email} value={c.phone}>
                      {c.name}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label htmlFor="c-note" className="adm-label">
                Note for the team
              </label>
              <input id="c-note" name="note" maxLength={300} defaultValue={coupon?.note} placeholder="Sorry for the late parcel" className="adm-input" />
              <p className="mt-1 text-xs text-muted">Only the admin sees this.</p>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
          <button className="btn btn-dark btn-sm" disabled={pending}>
            {pending ? "Saving…" : isNew ? "Create Coupon" : "Save Coupon"}
          </button>
          {state?.error && (
            <p role="alert" className="adm-error">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p role="status" className="adm-ok">
              {state.ok}
            </p>
          )}
        </div>
      </form>

      {!isNew && (
        <form
          action={deleteCouponAction}
          onSubmit={(e) => {
            if (!confirm(`Delete ${coupon.code}? Customers can no longer use it. Orders that used it keep their discount.`)) e.preventDefault();
          }}
          className="adm-card flex flex-wrap items-center justify-between gap-4 border-red-200"
        >
          <input type="hidden" name="code" value={coupon.code} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <div>
            <b className="text-sm font-medium">Delete this coupon</b>
            <p className="text-xs text-muted">Tip: untick “On” to pause it instead and keep its history.</p>
          </div>
          <button className="btn btn-sm border border-red-700 text-red-700 hover:bg-red-700 hover:text-white">Delete Coupon</button>
        </form>
      )}
    </>
  );
}

"use client";

import { useActionState } from "react";
import type { StoreSettings } from "@/lib/catalog";
import { saveSettingsAction } from "../../actions";
import { AnnouncementsField } from "./announcements-field";

function Field({ id, label, hint, ...rest }: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="adm-label">
        {label}
      </label>
      <input id={id} className="adm-input" {...rest} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Admin → Site Settings: contact details, social links and the announcement, all shown across the store. */
export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
      <section className="adm-card space-y-4">
        <div>
          <h2 className="adm-h2 !mb-1">Contact details</h2>
          <p className="text-xs text-muted">How customers reach TATTV. Under each field: where it appears on the site.</p>
        </div>
        <Field
          id="s-email"
          name="email"
          type="email"
          label="Email"
          defaultValue={settings.email}
          placeholder="contact@tattv.co.in"
          required
          hint="Shown on: footer, Contact Us, Help, Returns, My Account → Contact & Support, packing slips. Contact-form and return messages are emailed here."
        />
        <Field
          id="s-phone"
          name="phone"
          type="tel"
          label="Phone & WhatsApp number"
          defaultValue={settings.phone}
          placeholder="+91 98765 43210"
          hint="One number for calls and WhatsApp. Shown on: the green WhatsApp button, footer, Contact Us, Help, My Account → Contact & Support and “Help with this order”, the order confirmation page, packing slips."
        />
        <Field
          id="s-hours"
          name="hours"
          label="Support hours"
          defaultValue={settings.hours}
          placeholder="Mon–Sat, 10am–7pm IST"
          hint="Shown on: Contact Us (under Phone and in Support Hours), Help, My Account → Contact & Support."
        />
        <div>
          <label htmlFor="s-address" className="adm-label">
            Studio address
          </label>
          <textarea id="s-address" name="address" rows={3} defaultValue={settings.address} placeholder={"TATTV Studio, Street\nCity, State PIN, India"} className="adm-input h-auto py-2.5" />
          <p className="mt-1 text-xs text-muted">One line per row. Shown on: Contact Us, under “Studio”.</p>
        </div>
      </section>

      <div className="space-y-6">
        <section className="adm-card space-y-4">
          <div>
            <h2 className="adm-h2 !mb-1">Social media</h2>
            <p className="text-xs text-muted">Shown on: the top ribbon (Instagram, Facebook, X) and the footer (all four). Instagram also links the reels section on the home page. Leave a link empty to hide its icon.</p>
          </div>
          <Field id="s-ig" name="instagram" label="Instagram link" defaultValue={settings.instagram} placeholder="https://www.instagram.com/tattv.shop/" />
          <Field id="s-fb" name="facebook" label="Facebook link" defaultValue={settings.facebook} placeholder="https://www.facebook.com/yourpage" />
          <Field id="s-x" name="twitter" label="X (Twitter) link" defaultValue={settings.twitter} placeholder="https://x.com/yourhandle" />
          <Field id="s-yt" name="youtube" label="YouTube link" defaultValue={settings.youtube} placeholder="https://www.youtube.com/@yourchannel" />
        </section>

        <section className="adm-card space-y-4">
          <div>
            <h2 className="adm-h2 !mb-1">Prices &amp; payment rules</h2>
            <p className="text-xs text-muted">Every order is priced on the server with these numbers, so nobody can change them from their browser. Changes apply to new orders straight away.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="s-free" name="freeShippingAbove" type="number" min={0} step={1} required label="Free shipping from (₹)" defaultValue={settings.freeShippingAbove} hint="Bags of this much or more ship free. 0 = always free." />
            <Field id="s-ship" name="shippingFee" type="number" min={0} step={1} required label="Shipping fee below that (₹)" defaultValue={settings.shippingFee} />
            <Field id="s-gift" name="giftWrapFee" type="number" min={0} step={1} required label="Gift packing (₹)" defaultValue={settings.giftWrapFee} />
            <Field
              id="s-adv"
              name="codAdvancePercent"
              type="number"
              min={0}
              max={100}
              step={1}
              required
              label="Cash on delivery advance (%)"
              defaultValue={settings.codAdvancePercent}
              hint="Paid online at checkout to confirm a COD order; the courier collects the rest. 0 = all on delivery."
            />
          </div>
        </section>

        <section className="adm-card space-y-4">
          <div>
            <h2 className="adm-h2 !mb-1">Announcement ribbon</h2>
            <p className="text-xs text-muted">The black strip at the very top of every page. These messages rotate in this order; edit, reorder or remove any of them.</p>
          </div>
          <AnnouncementsField initial={settings.announcements} />
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
        <button className="btn btn-dark btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Save Site Settings"}
        </button>
        {state?.ok && (
          <p role="status" className="adm-ok">
            {state.ok}
          </p>
        )}
        {state?.error && (
          <p role="alert" className="adm-error">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}

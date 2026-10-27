"use client";

import { useActionState } from "react";
import type { StoreSettings } from "@/lib/catalog";
import { saveSettingsAction } from "../../actions";

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
          <p className="text-xs text-muted">Shown in the footer, Contact Us, Help, My Account and the WhatsApp button. Messages from the contact form are emailed to this address.</p>
        </div>
        <Field id="s-email" name="email" type="email" label="Email" defaultValue={settings.email} placeholder="care@tattv.shop" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="s-phone" name="phone" type="tel" label="Phone (for calls)" defaultValue={settings.phone} placeholder="+91 98765 43210" />
          <Field id="s-wa" name="whatsapp" type="tel" label="WhatsApp number" defaultValue={settings.whatsapp} placeholder="+91 98765 43210" />
        </div>
        <Field id="s-hours" name="hours" label="Support hours" defaultValue={settings.hours} placeholder="Mon–Sat, 10am–7pm IST" />
        <div>
          <label htmlFor="s-address" className="adm-label">
            Studio address
          </label>
          <textarea id="s-address" name="address" rows={3} defaultValue={settings.address} placeholder={"TATTV Studio, Street\nCity, State PIN, India"} className="adm-input h-auto py-2.5" />
          <p className="mt-1 text-xs text-muted">One line per row, as it should appear on the Contact page.</p>
        </div>
      </section>

      <div className="space-y-6">
        <section className="adm-card space-y-4">
          <div>
            <h2 className="adm-h2 !mb-1">Social media</h2>
            <p className="text-xs text-muted">Icons in the top ribbon and footer. Leave a link empty to hide its icon.</p>
          </div>
          <Field id="s-ig" name="instagram" label="Instagram link" defaultValue={settings.instagram} placeholder="https://www.instagram.com/tattv.shop/" />
          <Field id="s-fb" name="facebook" label="Facebook link" defaultValue={settings.facebook} placeholder="https://www.facebook.com/yourpage" />
          <Field id="s-x" name="twitter" label="X (Twitter) link" defaultValue={settings.twitter} placeholder="https://x.com/yourhandle" />
          <Field id="s-yt" name="youtube" label="YouTube link" defaultValue={settings.youtube} placeholder="https://www.youtube.com/@yourchannel" />
        </section>

        <section className="adm-card space-y-4">
          <div>
            <h2 className="adm-h2 !mb-1">Announcement</h2>
            <p className="text-xs text-muted">Shown first in the ribbon at the very top of every page, before the standard shipping and returns messages. Leave empty for just those.</p>
          </div>
          <label htmlFor="s-ann" className="sr-only">
            Announcement
          </label>
          <input id="s-ann" name="announcement" defaultValue={settings.announcement} maxLength={200} placeholder="e.g. Festive edit: 10% off with WELCOME10" className="adm-input" />
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

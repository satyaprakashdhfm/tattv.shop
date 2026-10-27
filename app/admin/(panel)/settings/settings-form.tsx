"use client";

import { useActionState } from "react";
import type { StoreSettings } from "@/lib/catalog";
import { saveSettingsAction } from "../../actions";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="adm-card max-w-2xl space-y-6">
      <div>
        <h2 className="adm-h2 !mb-1">Social media</h2>
        <p className="text-xs text-muted">Shown as icons on the right of the top ribbon and in the footer. Leave a link empty to hide its icon.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="s-ig" className="adm-label">
              Instagram link
            </label>
            <input id="s-ig" name="instagram" defaultValue={settings.instagram} placeholder="https://www.instagram.com/tattv.shop/" className="adm-input" />
          </div>
          <div>
            <label htmlFor="s-fb" className="adm-label">
              Facebook link
            </label>
            <input id="s-fb" name="facebook" defaultValue={settings.facebook} placeholder="https://www.facebook.com/yourpage" className="adm-input" />
          </div>
          <div>
            <label htmlFor="s-x" className="adm-label">
              X (Twitter) link
            </label>
            <input id="s-x" name="twitter" defaultValue={settings.twitter} placeholder="https://x.com/yourhandle" className="adm-input" />
          </div>
        </div>
      </div>
      <div>
        <h2 className="adm-h2 !mb-1">Announcement</h2>
        <p className="text-xs text-muted">Shown first in the ribbon at the very top of every page, before the standard shipping and returns messages. Leave empty for just those.</p>
        <label htmlFor="s-ann" className="sr-only">
          Announcement
        </label>
        <input id="s-ann" name="announcement" defaultValue={settings.announcement} maxLength={200} placeholder="e.g. Festive edit: 10% off with WELCOME10" className="adm-input mt-4" />
      </div>
      {state?.ok && (
        <p role="status" className="adm-ok">
          {state.ok}
        </p>
      )}
      <button className="btn btn-dark btn-sm" disabled={pending}>
        {pending ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { resetPolicyAction, savePolicyAction } from "../../actions";

/** The text of one policy page, in the simple writing format (see the hint beside it). */
export function PolicyForm({ slug, title, body, edited }: { slug: string; title: string; body: string; edited: boolean }) {
  const [state, action, pending] = useActionState(savePolicyAction, null);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.7fr_1fr]">
      <form action={action} className="adm-card space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <div>
          <label htmlFor="p-title" className="adm-label">
            Page title
          </label>
          <input id="p-title" name="title" defaultValue={title} required maxLength={120} className="adm-input" />
        </div>
        <div>
          <label htmlFor="p-body" className="adm-label">
            Text
          </label>
          <textarea id="p-body" name="body" defaultValue={body} rows={28} className="adm-input font-mono text-[13px] leading-relaxed" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button className="btn btn-dark btn-sm" disabled={pending}>
            {pending ? "Saving…" : "Save Policy"}
          </button>
          <a href={`/policies/${slug}`} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink">
            View on the store ↗
          </a>
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

      <aside className="space-y-6 lg:sticky lg:top-24">
        <section className="adm-card space-y-3 text-sm">
          <h2 className="adm-h2 !mb-0">How to write it</h2>
          <ul className="space-y-2 text-ink/75">
            <li>
              <code className="rounded bg-sand px-1.5">## Heading</code> starts a section
            </li>
            <li>
              <code className="rounded bg-sand px-1.5">- point</code> makes a bullet point
            </li>
            <li>A blank line starts a new paragraph</li>
          </ul>
          <p className="text-xs text-muted">These fill in by themselves from Site Settings and the store rules, so they stay right when those change:</p>
          <p className="flex flex-wrap gap-1.5 text-xs">
            {["{email}", "{phone}", "{address}", "{hours}", "{freeShipping}", "{shippingFee}", "{returnDays}"].map((v) => (
              <code key={v} className="rounded-full bg-sand px-2 py-0.5">
                {v}
              </code>
            ))}
          </p>
        </section>
        <section className="adm-card space-y-3 text-sm">
          <h2 className="adm-h2 !mb-0">Standard text</h2>
          <p className="text-xs text-muted">
            {edited
              ? "This page has your own text. Reset it to go back to the standard draft."
              : "This page still shows the standard draft. Words in [square brackets] (legal name, GSTIN, grievance officer) need TATTV's real details before launch."}
          </p>
          {edited && (
            <form
              action={resetPolicyAction}
              onSubmit={(e) => {
                if (!confirm("Replace your text with the standard draft? Your edits are lost.")) e.preventDefault();
              }}
            >
              <input type="hidden" name="slug" value={slug} />
              <button className="btn btn-outline btn-sm">Reset to standard text</button>
            </form>
          )}
        </section>
      </aside>
    </div>
  );
}

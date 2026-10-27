"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { api } from "@/lib/client-api";

/** Sends a message to Admin → Messages. */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (sent) {
    return (
      <div className="py-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-ink text-white">
          <Check size={22} />
        </span>
        <p className="display mt-5 text-2xl font-normal">Message sent</p>
        <p className="mt-2 text-sm text-muted">Thank you. We&apos;ll reply within 24 hours.</p>
      </div>
    );
  }

  const label = "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/70";

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api("/api/contact", { method: "POST", body: Object.fromEntries(new FormData(e.currentTarget)) });
          setSent(true);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="c-name" className={label}>
          Name
        </label>
        <input id="c-name" name="name" required autoComplete="name" className="field" />
      </div>
      <div>
        <label htmlFor="c-phone" className={label}>
          Mobile (optional)
        </label>
        <input id="c-phone" name="phone" type="tel" autoComplete="tel" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-email" className={label}>
          Email
        </label>
        <input id="c-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-body" className={label}>
          Message
        </label>
        <textarea id="c-body" name="body" required rows={5} className="field h-auto py-3" />
      </div>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-2">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-dark sm:col-span-2">
        {busy ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

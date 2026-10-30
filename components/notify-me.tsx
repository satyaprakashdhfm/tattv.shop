"use client";

import { useState } from "react";
import { BellRing, Check, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { WhatsAppIcon } from "./social-icons";

/** "Notify me" on a sold-out piece: name and WhatsApp number, and we message them when it is back. */
export function NotifyMe({ slug, name: productName, className = "" }: { slug: string; name: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/notify", { method: "POST", body: { slug, name, phone } });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`btn flex-1 bg-espresso !px-4 text-white hover:bg-espresso-hover ${className}`}>
        <BellRing size={16} strokeWidth={1.6} /> Notify Me
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Notify me when it's back">
          <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm animate-slide-down rounded-[2rem] bg-white p-6 shadow-lift md:p-7">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-line hover:border-ink">
              <X size={16} />
            </button>
            {done ? (
              <div className="py-4 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-ink text-white">
                  <Check size={22} />
                </span>
                <p className="title mt-4 text-base">You&apos;re on the list</p>
                <p className="mt-2 text-sm text-muted">We&apos;ll message you on WhatsApp as soon as {productName} is back in stock.</p>
              </div>
            ) : (
              <form onSubmit={send} className="space-y-4">
                <div className="pr-8">
                  <p className="eyebrow">Back in stock alert</p>
                  <p className="title mt-2 text-base">{productName}</p>
                  <p className="mt-1 text-sm text-muted">Leave your WhatsApp number and we&apos;ll tell you the moment it&apos;s back.</p>
                </div>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" autoComplete="given-name" className="field" />
                <div className="flex items-center gap-2">
                  <span className="flex h-12 items-center gap-1.5 rounded-full border border-line bg-sand px-4 text-sm text-ink/70">
                    <WhatsAppIcon size={15} /> +91
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^\d ]/g, "").slice(0, 11));
                      setError("");
                    }}
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    aria-label="WhatsApp number"
                    className="field flex-1"
                  />
                </div>
                {error && <p className="text-xs text-red-700">{error}</p>}
                <button className="btn btn-dark w-full" disabled={busy}>
                  {busy ? "Saving…" : "Notify Me"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

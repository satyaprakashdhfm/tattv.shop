"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, myOrders, type SavedOrder } from "@/lib/client-api";

export function TrackForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [id, setId] = useState(params.get("id") || "");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<SavedOrder[]>([]);

  useEffect(() => setRecent(myOrders()), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const d = await api<{ id: string; token: string }>("/api/orders/lookup", { method: "POST", body: { id, contact } });
      router.push(`/orders/${d.id}?t=${d.token}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="container-x max-w-xl py-14 md:py-20">
      <div className="text-center">
        <p className="eyebrow text-muted">Client Care</p>
        <h1 className="display mt-3 text-4xl font-normal md:text-5xl">Track Your Order</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink/70">
          Enter your order number (it starts with <b className="font-medium">TTV-</b>) and the email or mobile number you used at checkout.
        </p>
      </div>
      <form onSubmit={submit} className="mt-10 space-y-4 rounded-3xl border border-line bg-white p-6 md:p-8">
        <div>
          <label htmlFor="t-id" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/70">
            Order number
          </label>
          <input id="t-id" value={id} onChange={(e) => setId(e.target.value)} placeholder="TTV-104831" required autoCapitalize="characters" className="field" />
        </div>
        <div>
          <label htmlFor="t-contact" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/70">
            Email or mobile number
          </label>
          <input id="t-contact" value={contact} onChange={(e) => setContact(e.target.value)} required autoComplete="email" className="field" />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button className="btn btn-dark w-full" disabled={busy}>
          {busy ? "Looking…" : "Find My Order"}
        </button>
      </form>

      {recent.length > 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white p-6 md:p-8">
          <p className="eyebrow">Orders on this device</p>
          <ul className="mt-4 space-y-2 text-sm">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}?t=${o.token}`} className="font-medium underline-offset-4 hover:underline">
                  Order {o.id}
                </Link>
                <span className="text-muted"> · {new Date(o.at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, Upload } from "lucide-react";
import { useStore } from "@/components/store-provider";

const REASONS = [
  "Wrong size or fit",
  "Damaged or defective",
  "Not as described",
  "Received the wrong item",
  "Changed my mind",
  "Other",
];

export function ReturnsForm() {
  const params = useSearchParams();
  const { account } = useStore();
  const [type, setType] = useState<"return" | "exchange">(params.get("type") === "exchange" ? "exchange" : "return");
  const [photos, setPhotos] = useState<string[]>([]);
  const [reference, setReference] = useState<string | null>(null);

  if (reference) {
    return (
      <div className="py-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
          <Check size={22} />
        </span>
        <h2 className="display mt-6 text-3xl font-normal">Request received</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          Your {type} request <span className="font-medium text-ink">{reference}</span> has been logged. Our team will email you within 24 hours to arrange a free pickup.
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs text-muted">Preview site: requests aren&apos;t sent anywhere yet.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={account ? "/account" : "/shop"} className="btn btn-dark">
            {account ? "Back to My Account" : "Continue Shopping"}
          </Link>
          <button onClick={() => setReference(null)} className="btn btn-outline">
            New Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      // Re-mount once the saved session loads so the email default picks up the signed-in account.
      key={account?.email ?? "guest"}
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setReference(`RX-${Math.floor(100000 + Math.random() * 900000)}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <h2 className="display text-2xl font-normal">Start a request</h2>

      <fieldset>
        <legend className="mb-2 text-sm text-muted">I&apos;d like to</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["return", "exchange"] as const).map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer items-center justify-center border px-4 py-3 text-center text-sm font-medium transition ${
                type === t ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
              }`}
            >
              <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
              {t === "return" ? "Return for a refund" : "Exchange for another size"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1.5 block text-muted">Order ID</span>
          <input required name="order" defaultValue={params.get("order") ?? ""} placeholder="e.g. TTV-104829" className="field" />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block text-muted">Email used for the order</span>
          <input required type="email" name="email" defaultValue={account?.email ?? ""} placeholder="you@example.com" className="field" />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Item(s)</span>
        <input required name="items" defaultValue={params.get("item") ?? ""} placeholder="Which piece(s) are you returning or exchanging?" className="field" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1.5 block text-muted">Reason</span>
          <select required name="reason" defaultValue="" className="field appearance-none">
            <option value="" disabled>
              Select a reason
            </option>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        {type === "exchange" && (
          <label className="text-sm">
            <span className="mb-1.5 block text-muted">New size wanted</span>
            <input required name="size" placeholder="e.g. Ring size 18, Wrist M" className="field" />
          </label>
        )}
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Details</span>
        <textarea
          required
          name="details"
          rows={4}
          maxLength={600}
          placeholder="Tell us a little more, e.g. what's wrong with the piece or how it fits."
          className="field h-auto py-3"
        />
      </label>

      <div className="text-sm">
        <span className="mb-1.5 block text-muted">Photos (optional, helpful for damaged items)</span>
        <label className="flex cursor-pointer items-center gap-3 border border-dashed border-ink/30 bg-sand px-4 py-4 hover:border-ink">
          <Upload size={18} strokeWidth={1.5} />
          <span className="text-ink/75">{photos.length ? photos.join(", ") : "Upload up to 3 images"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 3).map((f) => f.name))}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm text-ink/75">
        <input required type="checkbox" className="mt-0.5 h-4 w-4 accent-ink" />
        The piece is unworn, with its tags and original TATTV packaging.
      </label>

      <button type="submit" className="btn btn-dark w-full">
        Submit Request
      </button>
    </form>
  );
}

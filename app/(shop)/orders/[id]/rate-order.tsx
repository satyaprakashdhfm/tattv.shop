"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/client-api";

type Given = { rating: number; title: string; body: string };

const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** "How was your order?": five stars and a few words, once the order is delivered. One per order. */
export function RateOrder({ orderId, token }: { orderId: string; token: string }) {
  const [given, setGiven] = useState<Given | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ review: Given | null }>(`/api/orders/${orderId}/review?t=${token}`)
      .then((d) => setGiven(d.review))
      .catch(() => setGiven(null));
  }, [orderId, token]);

  if (given === undefined) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Tap the stars to choose a rating.");
    setBusy(true);
    setError("");
    try {
      const d = await api<{ review: Given }>(`/api/orders/${orderId}/review`, { method: "POST", body: { token, rating, title, body: text } });
      setGiven(d.review);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shown = hover || rating;
  return (
    <section className="mt-5 rounded-3xl border border-[#e5d6bb] bg-[#fbf7f0] p-6 text-center md:p-8">
      {given ? (
        <>
          <h2 className="eyebrow">Thank you for your review</h2>
          <p className="mt-3 text-xl tracking-[0.08em] text-[#b8862b]" role="img" aria-label={`${given.rating} out of 5 stars`}>
            {"★".repeat(given.rating)}
            <span className="text-[#e5d6bb]">{"★".repeat(5 - given.rating)}</span>
          </p>
          {given.body && <p className="mx-auto mt-3 max-w-md text-sm italic leading-relaxed text-ink/70">&ldquo;{given.body}&rdquo;</p>}
        </>
      ) : (
        <form onSubmit={send}>
          <h2 className="eyebrow">How was your order?</h2>
          <p className="mt-2 text-sm text-muted">Rate the pieces and the delivery. It takes ten seconds and helps other customers choose.</p>
          <div className="mt-4 flex justify-center gap-1.5" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star size={30} strokeWidth={1.3} className={n <= shown ? "fill-[#b8862b] text-[#b8862b]" : "text-[#d8c7a6]"} />
              </button>
            ))}
          </div>
          <p className="mt-1 h-5 text-xs font-medium uppercase tracking-[0.16em] text-[#6b5434]">{WORDS[shown]}</p>
          {rating > 0 && (
            <div className="mx-auto mt-4 max-w-md space-y-3 text-left">
              <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="A title (optional), e.g. Still looks new" aria-label="Review title" className="field bg-white" />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Tell us what you liked, or what we could do better (optional)"
                aria-label="Your feedback"
                className="block w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
              />
            </div>
          )}
          {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
          <button className="btn btn-dark mt-5 h-11 px-8" disabled={busy || !rating}>
            {busy ? "Sending…" : "Send Review"}
          </button>
          <p className="mt-3 text-[11px] text-muted">If we share it on the site, it shows your first name, initial and city.</p>
        </form>
      )}
    </section>
  );
}

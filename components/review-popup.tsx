"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { api, myOrders } from "@/lib/client-api";
import { useStore } from "./store-provider";

type Waiting = { id: string; token: string; firstName: string; name: string; image: string; more: number };

const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const LATER_KEY = "tattv.review.later";
const LATER_DAYS = 3;

/**
 * "How was your order?": a pop-up with five stars and a comment, once one of the visitor's orders has
 * been delivered and not yet rated. "Maybe later" puts it off for a few days; it never shows on checkout.
 */
export function ReviewPopup() {
  const pathname = usePathname();
  const { sessionReady, account } = useStore();
  const [order, setOrder] = useState<Waiting | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [thanks, setThanks] = useState(false);

  const quiet = pathname.startsWith("/checkout") || pathname.startsWith("/orders/");

  useEffect(() => {
    if (!sessionReady || quiet) return;
    const refs = myOrders();
    if (!refs.length && !account) return;
    try {
      const later = JSON.parse(localStorage.getItem(LATER_KEY) || "{}") as Record<string, number>;
      api<{ order: Waiting | null }>("/api/reviews/pending", { method: "POST", body: { refs } })
        .then((d) => {
          if (d.order && !(later[d.order.id] > Date.now())) setTimeout(() => setOrder(d.order), 2500);
        })
        .catch(() => {});
    } catch {
      // Storage unavailable: no pop-up.
    }
  }, [sessionReady, account, quiet]);

  if (!order || quiet) return null;

  const later = () => {
    try {
      const all = JSON.parse(localStorage.getItem(LATER_KEY) || "{}");
      localStorage.setItem(LATER_KEY, JSON.stringify({ ...all, [order.id]: Date.now() + LATER_DAYS * 86400_000 }));
    } catch {
      // Storage unavailable: it closes for this page only.
    }
    setOrder(null);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Tap the stars to choose a rating.");
    setBusy(true);
    setError("");
    try {
      await api(`/api/orders/${order.id}/review`, { method: "POST", body: { token: order.token, rating, body: text } });
      setThanks(true);
      setTimeout(() => setOrder(null), 2200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shown = hover || rating;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="Rate your order">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={later} />
      <form onSubmit={send} className="relative w-full max-w-md animate-slide-down rounded-[2rem] border border-[#e5d6bb] bg-[#fbf7f0] p-6 text-center shadow-lift md:p-8">
        <button type="button" onClick={later} aria-label="Close" className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white text-ink/70 hover:text-ink">
          <X size={17} />
        </button>
        {thanks ? (
          <>
            <p className="text-2xl tracking-[0.08em] text-[#b8862b]">{"★".repeat(rating)}</p>
            <h2 className="title mt-3 text-lg">Thank you{order.firstName ? `, ${order.firstName}` : ""}</h2>
            <p className="mt-2 text-sm text-muted">Your review helps other customers choose.</p>
          </>
        ) : (
          <>
            {order.image && (
              <span className="relative mx-auto block size-20 overflow-hidden rounded-2xl bg-sand">
                <Image src={order.image} alt="" fill sizes="80px" className="object-cover" />
              </span>
            )}
            <p className="eyebrow mt-4 text-[#6b5434]">Order {order.id} · delivered</p>
            <h2 className="title mt-2 text-lg">How do you like {order.name || "your order"}?</h2>
            {order.more > 0 && <p className="text-xs text-muted">and {order.more} more {order.more === 1 ? "piece" : "pieces"}</p>}
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
                  <Star size={32} strokeWidth={1.3} className={n <= shown ? "fill-[#b8862b] text-[#b8862b]" : "text-[#d8c7a6]"} />
                </button>
              ))}
            </div>
            <p className="mt-1 h-5 text-xs font-medium uppercase tracking-[0.16em] text-[#6b5434]">{WORDS[shown]}</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="A few words about the piece or the delivery (optional)"
              aria-label="Your comment"
              className="mt-3 block w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-left text-sm outline-none focus:border-ink"
            />
            {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
            <button className="btn btn-dark mt-4 h-11 w-full" disabled={busy || !rating}>
              {busy ? "Sending…" : "Send Review"}
            </button>
            <button type="button" onClick={later} className="mt-3 text-xs text-muted underline underline-offset-2 hover:text-ink">
              Maybe later
            </button>
          </>
        )}
      </form>
    </div>
  );
}

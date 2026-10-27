"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { formatPrice } from "@/lib/format";

/**
 * Stand-in for the Razorpay window, used only while Razorpay keys are not configured.
 * Once RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set, checkout opens the real Razorpay instead.
 */
export function DemoPayment({
  amount,
  orderId,
  onSuccess,
  onFailure,
  onDismiss,
}: {
  amount: number;
  orderId: string;
  onSuccess: () => Promise<void>;
  onFailure: () => void;
  onDismiss: () => void;
}) {
  const [stage, setStage] = useState<"choose" | "processing" | "failed">("choose");
  const [err, setErr] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && stage !== "processing" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [stage, onDismiss]);

  const run = (succeed: boolean) => {
    setStage("processing");
    setTimeout(async () => {
      if (!succeed) return setStage("failed");
      try {
        await onSuccess();
      } catch (e) {
        setErr((e as Error).message);
        setStage("failed");
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-labelledby="demo-pay-title">
      <div className="absolute inset-0 animate-fade-in bg-black/50" />
      <div className="relative w-full max-w-sm animate-fade-in overflow-hidden rounded-3xl bg-white shadow-lift">
        <div className="flex items-start justify-between bg-ink px-6 py-5 text-white">
          <div>
            <p id="demo-pay-title" className="eyebrow">Demo Payment</p>
            <p className="mt-1 text-xs text-white/60">Order {orderId}</p>
          </div>
          <p className="text-xl font-medium">{formatPrice(amount)}</p>
        </div>
        <div className="space-y-4 p-6">
          {stage === "choose" && (
            <>
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                Simulated payment window: no money is charged. Add Razorpay keys to take real payments.
              </p>
              <button className="btn btn-dark w-full" onClick={() => run(true)}>
                Simulate successful payment
              </button>
              <button className="btn btn-outline w-full" onClick={() => run(false)}>
                Simulate failed payment
              </button>
              <button className="mx-auto flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted hover:text-ink" onClick={onDismiss}>
                <X size={13} /> Cancel
              </button>
            </>
          )}
          {stage === "processing" && (
            <p className="flex items-center justify-center gap-3 py-6 text-sm">
              <Loader2 size={18} className="animate-spin" /> Processing…
            </p>
          )}
          {stage === "failed" && (
            <>
              <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err || "The payment failed."}</p>
              <button
                className="btn btn-dark w-full"
                onClick={() => {
                  setErr("");
                  setStage("choose");
                }}
              >
                Try again
              </button>
              <button className="btn btn-outline w-full" onClick={onFailure}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

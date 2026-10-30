"use client";

import { X } from "lucide-react";
import type { Account } from "@/lib/demo-account";
import { OtpLogin, type OtpConfig } from "./otp-login";
import { useStore } from "./store-provider";

/**
 * Sign in without leaving the page: a pop-up with the mobile number and code (MSG91). Used by the header's
 * account button and at checkout. Shown only while mobile login is switched on (CUSTOMER_OTP_LOGIN).
 */
export function QuickLogin({ config, onClose, onSignedIn, title = "Sign In", note }: { config: OtpConfig; onClose: () => void; onSignedIn?: (a: Account) => void; title?: string; note?: string }) {
  const { setSignedIn } = useStore();
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-slide-down rounded-[2rem] bg-white p-6 shadow-lift md:p-7">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-line hover:border-ink">
          <X size={16} />
        </button>
        <p className="title text-base">{title}</p>
        <p className="mb-5 mt-1 pr-8 text-sm text-muted">{note ?? "Your orders, coupons and wishlist, with just your mobile number."}</p>
        <OtpLogin
          config={config}
          onSignedIn={(a) => {
            setSignedIn(a);
            onSignedIn?.(a);
            onClose();
          }}
        />
      </div>
    </div>
  );
}

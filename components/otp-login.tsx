"use client";

import { useEffect, useRef, useState } from "react";
import type { Account } from "@/lib/demo-account";
import { api } from "@/lib/client-api";

// Mobile number + one-time code sign-in (lib/server/otp.ts). With MSG91's widget, the widget texts and
// checks the code in the browser (with its captcha) and our server confirms the result with MSG91;
// otherwise our server texts its own code. In local test mode the code is shown on screen.

export interface OtpConfig {
  available: boolean;
  widget: { widgetId: string; tokenAuth: string } | null;
  testMode: boolean;
}

declare global {
  interface Window {
    initSendOTP?: (opts: Record<string, unknown>) => void;
    sendOtp?: (to: string, ok: (d: { message?: string }) => void, fail: (e: unknown) => void) => void;
    retryOtp?: (channel: string | null, ok: (d: { message?: string }) => void, fail: (e: unknown) => void, reqId?: string) => void;
    verifyOtp?: (code: string, ok: (d: { message?: string }) => void, fail: (e: unknown) => void, reqId?: string) => void;
    isCaptchaVerified?: () => boolean;
  }
}

const SCRIPTS = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];
export const CAPTCHA_ID = "msg91-captcha";
const RESEND_AFTER = 30;

let configPromise: Promise<OtpConfig> | null = null;
/** The login setup from the server, once per page; undefined while loading. */
export function useOtpConfig() {
  const [config, setConfig] = useState<OtpConfig | undefined>(undefined);
  useEffect(() => {
    let live = true;
    configPromise ??= api<OtpConfig>("/api/auth/otp/config").catch(() => {
      configPromise = null;
      return { available: false, widget: null, testMode: false };
    });
    configPromise.then((c) => live && setConfig(c));
    return () => {
      live = false;
    };
  }, []);
  return config;
}

let scriptPromise: Promise<void> | null = null;
function loadScript(i = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPTS[i];
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      s.remove();
      if (i + 1 < SCRIPTS.length) loadScript(i + 1).then(resolve, reject);
      else reject(new Error("script"));
    };
    document.head.appendChild(s);
  });
}

export async function startWidget(w: NonNullable<OtpConfig["widget"]>) {
  scriptPromise ??= loadScript().catch((e) => {
    scriptPromise = null;
    throw e;
  });
  await scriptPromise;
  if (!window.initSendOTP) throw new Error("widget");
  window.initSendOTP({ widgetId: w.widgetId, tokenAuth: w.tokenAuth, exposeMethods: true, captchaRenderId: CAPTCHA_ID, success: () => {}, failure: () => {} });
  for (let waited = 0; !window.sendOtp || !window.verifyOtp; waited += 100) {
    if (waited > 5000) throw new Error("widget");
    await new Promise((r) => setTimeout(r, 100));
  }
}

export function OtpLogin({ config, onSignedIn }: { config: OtpConfig; onSignedIn: (a: Account) => void }) {
  const widget = config.widget;
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  const [shownCode, setShownCode] = useState("");
  const [ready, setReady] = useState(!widget);
  const [captcha, setCaptcha] = useState({ shown: false, ticked: false });
  const reqId = useRef<string | undefined>(undefined);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!widget) return;
    let live = true;
    startWidget(widget)
      .then(() => live && setReady(true))
      .catch(() => live && setError("Mobile codes are not available right now. Please try again in a minute."));
    return () => {
      live = false;
    };
  }, [widget]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  // The widget has no event for its captcha, so it is read twice a second.
  useEffect(() => {
    if (!widget || step !== "phone") return;
    const look = () => {
      const shown = !!document.getElementById(CAPTCHA_ID)?.childElementCount;
      const ticked = shown && !!window.isCaptchaVerified?.();
      setCaptcha((c) => (c.shown === shown && c.ticked === ticked ? c : { shown, ticked }));
    };
    look();
    const t = setInterval(look, 500);
    return () => clearInterval(t);
  }, [widget, step]);

  const digits = phone.replace(/\D/g, "").slice(-10);
  const valid = /^[6-9]\d{9}$/.test(digits);
  const needCaptcha = !!widget && captcha.shown && !captcha.ticked;

  const sent = () => {
    setStep("code");
    setCode("");
    setWait(RESEND_AFTER);
    setBusy(false);
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const send = async (resend = false) => {
    if (!valid || !ready || busy) return;
    if (!resend && needCaptcha) return setError("Please tick “I am human” first.");
    setBusy(true);
    setError("");
    if (widget) {
      const failed = () => {
        setError("We couldn't send a code to that number. Please check it and try again.");
        setBusy(false);
      };
      const ok = (d: { message?: string }) => {
        if (!resend) reqId.current = d?.message;
        sent();
      };
      if (resend && window.retryOtp) window.retryOtp(null, ok, failed, reqId.current);
      else window.sendOtp!(`91${digits}`, ok, failed);
      return;
    }
    try {
      const d = await api<{ code?: string }>("/api/auth/otp/send", { method: "POST", body: { phone: digits } });
      setShownCode(d.code ?? "");
      sent();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const finish = async (body: Record<string, string>) => {
    const d = await api<{ customer: Account }>("/api/auth/otp/verify", { method: "POST", body });
    onSignedIn(d.customer);
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4 || busy) return;
    setBusy(true);
    setError("");
    if (widget) {
      window.verifyOtp!(
        code,
        async (d) => {
          try {
            if (!d?.message) throw new Error("We could not complete the check. Please try again.");
            await finish({ accessToken: d.message });
          } catch (err) {
            setError((err as Error).message);
            setBusy(false);
          }
        },
        () => {
          setError("That code is not right, or it has expired. Check it or send a new one.");
          setBusy(false);
        },
        reqId.current,
      );
      return;
    }
    finish({ phone: digits, code }).catch((err) => {
      setError((err as Error).message);
      setBusy(false);
    });
  };

  if (step === "phone") {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="otp-phone" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/70">
          Mobile number
        </label>
        <div className="flex items-center gap-2">
          <span className="flex h-12 items-center rounded-full border border-line bg-sand px-4 text-sm text-ink/70">+91</span>
          <input
            id="otp-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^\d ]/g, "").slice(0, 11));
              setError("");
            }}
            className="field flex-1"
          />
        </div>
        {/* MSG91's captcha, drawn here when it is switched on in the widget settings. */}
        {widget && <div id={CAPTCHA_ID} className="flex justify-center" />}
        {error && (
          <p role="alert" className="text-center text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-dark w-full" disabled={busy || !ready || !valid || needCaptcha}>
          {busy ? "Sending…" : !ready ? "Getting ready…" : "Send Code"}
        </button>
        <p className="text-center text-xs text-muted">We&apos;ll text you a one-time code. New here? Your account is made when you sign in.</p>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <p className="text-center text-sm text-ink/75">
        Enter the code sent to <b className="font-medium">+91 {digits}</b>{" "}
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setError("");
          }}
          className="text-xs underline underline-offset-2"
        >
          Change
        </button>
      </p>
      {config.testMode && shownCode && (
        <p className="rounded-2xl border border-dashed border-ink/25 bg-sand px-4 py-3 text-center text-xs">
          Test mode (MSG91 not set up): your code is <b className="text-base tracking-[0.3em]">{shownCode}</b>
        </p>
      )}
      <input
        ref={codeRef}
        aria-label="The code from the SMS"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={8}
        required
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, 8));
          setError("");
        }}
        className="field text-center text-lg tracking-[0.5em]"
      />
      {error && (
        <p role="alert" className="text-center text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-dark w-full" disabled={busy || code.length < 4}>
        {busy ? "Checking…" : "Verify & Sign In"}
      </button>
      <p className="text-center text-xs text-muted">
        {wait > 0 ? (
          `Didn't get it? Resend in ${wait}s`
        ) : (
          <button type="button" onClick={() => send(true)} disabled={busy} className="underline underline-offset-2">
            Resend code
          </button>
        )}
      </p>
    </form>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { CAPTCHA_ID, startWidget } from "@/components/otp-login";
import { moneyCodeAction, moneyConfirmAction } from "../../../actions";

const PARTS: [number, string][] = [
  [25, "25%"],
  [50, "Half"],
  [75, "75%"],
  [100, "Full"],
];
const share = (left: number, pct: number) => Math.round((left * pct) / 100);
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

type Sent = { phoneHint: string; intent: { kind: "cancel" } | { kind: "refund"; amount: number }; widgetPhone?: string; code?: string };
type Money = { paid: number; refunded: number; left: number; live: boolean };
type Widget = { widgetId: string; tokenAuth: string };

/**
 * Cancel the whole order, or send part of the money back, as on Minimalstoys. Step 1 checks the request
 * and texts a code to the owner; step 2 takes the code. Nothing is cancelled or refunded until it checks out.
 */
export function MoneyPanel({
  id,
  canCancel,
  money,
  waybill,
  refunds,
  reasons,
  codesReady,
  widget,
}: {
  id: string;
  canCancel: boolean;
  money: Money | null;
  waybill: string | null;
  refunds: { at: string; amount: number; reason: string; note: string; refundId: string }[];
  reasons: [string, { label: string; line: string }][];
  codesReady: boolean;
  widget: Widget | null;
}) {
  const [mode, setMode] = useState<"cancel" | "refund" | null>(null);
  const [form, setForm] = useState({ reason: "", reasonCode: "", amount: "", note: "" });
  const [sent, setSent] = useState<Sent | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [busy, start] = useTransition();
  const left = money?.left ?? 0;

  const open = (m: "cancel" | "refund") => {
    setMode(m);
    setSent(null);
    setCode("");
    setMsg(null);
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const finished = (r: { done: string }) => {
    setMsg({ ok: r.done });
    setMode(null);
    setSent(null);
    setForm({ reason: "", reasonCode: "", amount: "", note: "" });
  };

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await moneyCodeAction(id, { kind: mode ?? "", ...form });
      if ("error" in r) setMsg({ error: r.error });
      else {
        setSent(r as Sent);
        setCode("");
      }
    });
  };
  const confirmCode = (proof: { code?: string; accessToken?: string }) =>
    new Promise<void>((resolve) =>
      start(async () => {
        const r = await moneyConfirmAction(id, proof);
        if ("error" in r) setMsg({ error: r.error });
        else finished(r);
        resolve();
      }),
    );

  const what = !sent ? "" : sent.intent.kind === "cancel" ? `Cancel the order${left > 0 ? ` and refund ${formatPrice(left)}` : ""}` : `Refund ${formatPrice(sent.intent.amount)}`;
  const danger = "btn btn-sm border border-red-700 text-red-700 hover:bg-red-700 hover:text-white";

  return (
    <section className="adm-card space-y-4">
      <div>
        <h2 className="adm-h2 !mb-1">Cancel or refund</h2>
        <p className="text-xs text-muted">Customers can&apos;t cancel on the site; they call you. Each cancel or refund needs a code sent to the owner&apos;s mobile.</p>
      </div>
      {money ? (
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Paid online</dt>
            <dd>{formatPrice(money.paid)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Refunded</dt>
            <dd>{formatPrice(money.refunded)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Left to refund</dt>
            <dd className="font-medium">{formatPrice(left)}</dd>
          </div>
        </dl>
      ) : (
        <p className="adm-error">Couldn&apos;t read the payment from Razorpay just now. Refresh to try again.</p>
      )}
      {refunds.length > 0 && (
        <ul className="space-y-2 text-sm">
          {refunds.map((r) => (
            <li key={r.refundId}>
              <b className="font-medium">{formatPrice(r.amount)}</b> · {r.reason}
              {r.note ? ` · ${r.note}` : ""}
              <span className="block text-xs text-muted">
                {when(r.at)} · {r.refundId}
              </span>
            </li>
          ))}
        </ul>
      )}

      {msg?.ok && (
        <p role="status" className="adm-ok">
          {msg.ok}
        </p>
      )}

      {!mode && (
        <div className="flex flex-wrap gap-2">
          {!codesReady ? (
            <p className="text-xs text-muted">SMS codes are not set up yet (MSG91), so cancelling and refunding can&apos;t be approved here.</p>
          ) : (
            <>
              {canCancel && (
                <button type="button" className={danger} onClick={() => open("cancel")}>
                  Cancel Order
                </button>
              )}
              {left > 0 && (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => open("refund")}>
                  Refund Money
                </button>
              )}
              {!canCancel && left <= 0 && <p className="text-xs text-muted">Nothing to cancel or refund on this order.</p>}
            </>
          )}
        </div>
      )}

      {mode && !sent && (
        <form onSubmit={ask} className="space-y-3">
          {mode === "cancel" ? (
            <>
              <p className="text-sm font-medium">Cancelling this order will:</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {waybill && <li>Cancel the Delhivery shipment ({waybill})</li>}
                <li>{left > 0 ? <>Refund <b className="font-medium">{formatPrice(left)}</b> to the customer (5–7 working days)</> : "Refund nothing: no money was paid online"}</li>
                <li>Put the pieces back in stock and email the customer</li>
              </ul>
              <div>
                <label htmlFor="mp-reason" className="adm-label">
                  Reason (the customer sees this)
                </label>
                <textarea id="mp-reason" rows={2} maxLength={300} required value={form.reason} onChange={set("reason")} placeholder="Sorry, this piece didn't pass our final check." className="adm-input" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="mp-why" className="adm-label">
                  Why
                </label>
                <select id="mp-why" required value={form.reasonCode} onChange={set("reasonCode")} className="adm-input">
                  <option value="">Choose a reason</option>
                  {reasons.map(([k, r]) => (
                    <option key={k} value={k}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="mp-amt" className="adm-label">
                  Amount (₹)
                </label>
                <input id="mp-amt" type="number" min="1" step="1" max={left} required value={form.amount} onChange={set("amount")} placeholder={`Up to ${formatPrice(left)}`} className="adm-input" />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PARTS.map(([pct, label]) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setForm({ ...form, amount: String(share(left, pct)) })}
                      className={`rounded-full border px-3 py-1 text-xs ${Number(form.amount) === share(left, pct) ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                    >
                      {label} · {formatPrice(share(left, pct))}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="mp-note" className="adm-label">
                  Note for the customer (optional)
                </label>
                <input id="mp-note" maxLength={300} value={form.note} onChange={set("note")} placeholder="The chain clasp came loose in transit." className="adm-input" />
              </div>
            </>
          )}
          {msg?.error && (
            <p role="alert" className="adm-error">
              {msg.error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-dark btn-sm" disabled={busy}>
              {busy ? "Sending…" : "Send Code to Owner"}
            </button>
            <button type="button" onClick={() => setMode(null)} className="text-xs underline underline-offset-2">
              Back
            </button>
          </div>
        </form>
      )}

      {sent?.widgetPhone && widget && (
        <WidgetCode
          widget={widget}
          phone={sent.widgetPhone}
          phoneHint={sent.phoneHint}
          what={what}
          error={msg?.error}
          onVerified={(accessToken) => confirmCode({ accessToken })}
          onBack={() => setSent(null)}
        />
      )}

      {sent && !sent.widgetPhone && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            confirmCode({ code });
          }}
          className="space-y-3"
        >
          <p className="text-sm">
            A code was sent to the owner&apos;s mobile <b className="font-medium">{sent.phoneHint}</b>. Ask them for it to approve: <b className="font-medium">{what}</b>.
          </p>
          {sent.code && (
            <p className="rounded-2xl border border-dashed border-ink/25 bg-sand px-4 py-3 text-xs">
              Test mode (SMS not connected): the code is <b className="text-base tracking-[0.3em]">{sent.code}</b>
            </p>
          )}
          <div>
            <label htmlFor="mp-code" className="adm-label">
              6-digit code
            </label>
            <input
              id="mp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="adm-input w-40 text-center tracking-[0.4em]"
            />
          </div>
          {msg?.error && (
            <p role="alert" className="adm-error">
              {msg.error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button className={sent.intent.kind === "cancel" ? danger : "btn btn-dark btn-sm"} disabled={busy || code.length < 6}>
              {busy ? "Working…" : what}
            </button>
            <button type="button" onClick={() => setSent(null)} className="text-xs underline underline-offset-2">
              Change
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/** MSG91's widget: texts the owner after its captcha and checks the code; our server then confirms the token. */
function WidgetCode({ widget, phone, phoneHint, what, error, onVerified, onBack }: { widget: Widget; phone: string; phoneHint: string; what: string; error?: string; onVerified: (accessToken: string) => Promise<void>; onBack: () => void }) {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"send" | "code">("send");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [reqId, setReqId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let live = true;
    startWidget(widget)
      .then(() => live && setReady(true))
      .catch(() => live && setProblem("SMS codes are not available right now. Please try again in a minute."));
    return () => {
      live = false;
    };
  }, [widget]);

  const send = () => {
    setBusy(true);
    setProblem("");
    window.sendOtp!(
      `91${phone}`,
      (d) => {
        setReqId(d?.message);
        setStep("code");
        setBusy(false);
      },
      () => {
        setProblem("The code couldn't be sent. Tick the captcha and try again.");
        setBusy(false);
      },
    );
  };
  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setProblem("");
    window.verifyOtp!(
      code,
      async (d) => {
        if (d?.message) await onVerified(d.message);
        else setProblem("The check didn't complete. Please try again.");
        setBusy(false);
      },
      () => {
        setProblem("That code is not right, or it has expired.");
        setBusy(false);
      },
      reqId,
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm">
        To approve <b className="font-medium">{what}</b>, a code goes to the owner&apos;s mobile {phoneHint}. Ask them for it.
      </p>
      {step === "send" ? (
        <>
          <div id={CAPTCHA_ID} />
          <button type="button" className="btn btn-dark btn-sm" disabled={!ready || busy} onClick={send}>
            {busy ? "Sending…" : !ready ? "Getting ready…" : "Send Code to Owner"}
          </button>
        </>
      ) : (
        <form onSubmit={verify} className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Owner's code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className="adm-input w-40 text-center tracking-[0.4em]"
          />
          <button className="btn btn-dark btn-sm" disabled={busy || code.length < 4}>
            {busy ? "Working…" : what}
          </button>
        </form>
      )}
      {(problem || error) && (
        <p role="alert" className="adm-error">
          {problem || error}
        </p>
      )}
      <button type="button" onClick={onBack} className="text-xs underline underline-offset-2">
        Change
      </button>
    </div>
  );
}

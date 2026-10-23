"use client";

import { useState } from "react";

export default function AccountPage() {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="container-x flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <h1 className="display text-center text-5xl">{mode === "signin" ? "Sign In" : "Create Account"}</h1>
        <p className="mt-3 text-center text-sm text-muted">
          {mode === "signin" ? "Access your orders, wishlist and saved addresses." : "Join TATTV for early access and faster checkout."}
        </p>
        <div className="mt-10 grid grid-cols-2 border-b border-line">
          {(["signin", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setMessage(null);
              }}
              className={`eyebrow -mb-px border-b pb-3 ${mode === m ? "border-ink" : "border-transparent text-muted"}`}
            >
              {m === "signin" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage("Accounts are coming soon. This storefront is a frontend preview.");
          }}
        >
          {mode === "register" && <input required placeholder="Full name" aria-label="Full name" className="field" />}
          <input required type="email" placeholder="Email" aria-label="Email" className="field" />
          <input required type="password" placeholder="Password" aria-label="Password" minLength={6} className="field" />
          <button type="submit" className="btn btn-dark w-full">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
          {message && <p className="text-center text-sm text-muted">{message}</p>}
        </form>
      </div>
    </div>
  );
}

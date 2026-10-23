"use client";

import { useState } from "react";

export function NotifyForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="mt-10 text-sm text-white/80">Thank you. We&apos;ll let you know the moment we launch.</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email) setDone(true);
      }}
      className="mt-10 flex flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        aria-label="Email address"
        className="h-12 flex-1 border border-white/25 bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-white/40 focus:border-white"
      />
      <button
        type="submit"
        className="h-12 bg-white px-7 text-[11px] font-medium uppercase tracking-[0.24em] text-ink transition-colors hover:bg-white/85"
      >
        Notify Me
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function NewsletterForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const line = tone === "dark" ? "border-white/40 focus-within:border-white" : "border-ink/30 focus-within:border-ink";

  if (done) {
    return (
      <p className="mt-6 flex items-center gap-2 text-sm">
        <Check size={16} /> Thank you. You&apos;re on the list.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email) setDone(true);
      }}
      className={`mt-6 flex max-w-sm items-center border-b ${line} transition-colors`}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        aria-label="Email address"
        className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
      />
      <button type="submit" aria-label="Subscribe" className="p-2 hover:opacity-60">
        <ArrowRight size={18} strokeWidth={1.5} />
      </button>
    </form>
  );
}

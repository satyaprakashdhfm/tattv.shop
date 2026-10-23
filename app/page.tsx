import Image from "next/image";
import { NotifyForm } from "./notify-form";

const CATEGORIES = ["Chains & Pendants", "Rings", "Bracelets", "Wallets"];

export default function ComingSoonPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 animate-glow rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_65%)]"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Image
          src="/brand/logo-white.png"
          alt="TATTV · Energize Your Style Element"
          width={1147}
          height={294}
          priority
          className="h-auto w-[240px] animate-rise sm:w-[340px]"
        />

        <p className="eyebrow mt-16 animate-rise text-white/50 [animation-delay:200ms]">Launching Soon</p>
        <h1 className="mt-5 max-w-2xl animate-rise font-serif text-4xl font-light leading-tight [animation-delay:350ms] sm:text-6xl">
          Something <em>elemental</em> is coming.
        </h1>
        <p className="mt-6 max-w-md animate-rise text-sm font-light leading-relaxed text-white/60 [animation-delay:500ms] sm:text-base">
          Modern and classic jewellery for men, crafted in sterling silver, gold and fine leather. Be the first to know when we open our doors.
        </p>

        <div className="w-full max-w-md animate-rise [animation-delay:650ms]">
          <NotifyForm />
        </div>

        <ul className="mt-14 flex animate-rise flex-wrap justify-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-white/40 [animation-delay:800ms]">
          {CATEGORIES.map((c, i) => (
            <li key={c} className="flex items-center gap-3">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-white/25" />}
              {c}
            </li>
          ))}
        </ul>
      </div>

      <footer className="relative z-10 flex flex-col items-center gap-2 px-6 pb-8 text-xs text-white/35 sm:flex-row sm:justify-between sm:px-10">
        <p>© {new Date().getFullYear()} TATTV · tattv.shop</p>
        <p className="tracking-[0.18em] uppercase">Energize Your Style Element</p>
      </footer>
    </main>
  );
}

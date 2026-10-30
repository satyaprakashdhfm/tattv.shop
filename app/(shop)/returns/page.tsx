import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RETURN_WINDOW_DAYS } from "@/lib/site";
import { loadCatalogData } from "@/lib/server/catalog";
import { ReturnsFormFromLink } from "./returns-form";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description: `Start a return or exchange within ${RETURN_WINDOW_DAYS} days of delivery.`,
};

const STEPS = [
  { n: "01", title: "Submit a request", text: "Tell us the order, the piece and what you'd like to do." },
  { n: "02", title: "We arrange a pickup", text: "Our team confirms within 24 hours and schedules a free pickup." },
  { n: "03", title: "Refund or exchange", text: "Once the piece is checked, we refund or dispatch your exchange." },
];

export default async function ReturnsPage() {
  const { settings } = await loadCatalogData();
  return (
    <div className="container-x py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-muted">Client Care</p>
        <h1 className="display mt-3 text-4xl font-normal md:text-5xl">Returns &amp; Exchanges</h1>
        <p className="mt-4 leading-relaxed text-ink/70">
          Not quite right? Return or exchange unworn pieces within {RETURN_WINDOW_DAYS} days of delivery. Fill in the form and we&apos;ll take it from there.{" "}
          <Link href="/policies/returns-refunds" className="underline underline-offset-2">
            Read the full policy
          </Link>
          .
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-line bg-white p-7 md:p-9">
          <Suspense fallback={<div className="min-h-[480px]" />}>
            <ReturnsFormFromLink />
          </Suspense>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-line bg-white p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">How it works</p>
            <ol className="mt-5 space-y-5">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="font-serif text-2xl leading-none text-gold">{s.n}</span>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl border border-line bg-sand p-7 text-sm text-ink/75">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Good to know</p>
            <ul className="mt-4 space-y-2">
              <li>Pieces must be unworn, with tags and original packaging.</li>
              <li>Engraved or personalised pieces are final sale.</li>
              <li>Refunds go to the original payment method within 5–7 working days.</li>
            </ul>
            <p className="mt-4">
              Questions?{" "}
              <Link href="/contact" className="underline underline-offset-4">
                Contact us
              </Link>{" "}
              or email {settings.email}.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { RETURN_WINDOW_DAYS, telHref, whatsappLink } from "@/lib/site";
import { loadCatalogData } from "@/lib/server/catalog";
import { WhatsAppIcon } from "@/components/social-icons";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description: `Return or exchange unworn pieces within ${RETURN_WINDOW_DAYS} days of delivery: call or WhatsApp us with your order number.`,
};

const STEPS = [
  { n: "01", title: "Call or WhatsApp us", text: "Tell us your order number, the piece and what you'd like to do." },
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
          Not quite right? Return or exchange unworn pieces within {RETURN_WINDOW_DAYS} days of delivery. Returns, exchanges and cancellations are handled by our team: call or WhatsApp us with your order number.{" "}
          <Link href="/policies/returns-refunds" className="underline underline-offset-2">
            Read the full policy
          </Link>
          .
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* No self-service form: the team takes every return, exchange or cancellation by phone or WhatsApp. */}
        <section className="rounded-3xl border border-line bg-white p-7 md:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Talk to us</p>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">Have your order number ready (it starts with TTV-, in your confirmation email and on your order page). {settings.hours}.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a href={telHref(settings.phone)} className="flex items-center gap-4 rounded-3xl border border-line p-5 transition-colors hover:border-ink">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-sand">
                <Phone size={18} strokeWidth={1.5} />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em]">Call</span>
                <span className="text-sm">{settings.phone}</span>
              </span>
            </a>
            <a
              href={whatsappLink("Hi TATTV! I'd like to return or exchange a piece from my order TTV-", settings.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-3xl border border-line p-5 transition-colors hover:border-ink"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#25d366] text-white">
                <WhatsAppIcon size={20} />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em]">WhatsApp</span>
                <span className="text-sm">Message us</span>
              </span>
            </a>
            <a href={`mailto:${settings.email}?subject=${encodeURIComponent("Return or exchange")}`} className="flex items-center gap-4 rounded-3xl border border-line p-5 transition-colors hover:border-ink sm:col-span-2">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-sand">
                <Mail size={18} strokeWidth={1.5} />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em]">Email</span>
                <span className="text-sm">{settings.email}</span>
              </span>
            </a>
          </div>
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

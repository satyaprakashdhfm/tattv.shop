import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone, RotateCcw } from "lucide-react";
import { WhatsAppIcon } from "@/components/social-icons";
import { telHref, whatsappHello } from "@/lib/site";
import { loadCatalogData } from "@/lib/server/catalog";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Email, WhatsApp or call TATTV client care. We reply within 24 hours.",
};

export default async function ContactPage() {
  // Contact details come from Admin → Site Settings.
  const { settings: s } = await loadCatalogData();
  const CHANNELS = [
    { icon: Mail, title: "Email", value: s.email, href: `mailto:${s.email}`, note: "We reply within 24 hours" },
    { icon: WhatsAppIcon, title: "WhatsApp", value: s.whatsapp, href: whatsappHello(s.whatsapp), note: "Message us anytime", external: true },
    { icon: Phone, title: "Phone", value: s.phone, href: telHref(s.phone), note: s.hours },
  ];
  return (
    <div className="container-x py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-muted">Client Care</p>
        <h1 className="display mt-3 text-4xl font-normal md:text-5xl">Contact Us</h1>
        <p className="mt-4 leading-relaxed text-ink/70">
          We&apos;re here to help with orders, sizing, returns or anything else. Email or WhatsApp us and our team will get back to you within 24 hours.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-line bg-white p-7 md:p-9">
          <h2 className="display text-2xl font-normal">Get in Touch</h2>
          <ul className="mt-6 space-y-6">
            {CHANNELS.map(({ icon: Icon, title, value, href, note, external }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand">
                  <Icon size={17} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{title}</p>
                  <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="mt-1 inline-block text-ink/85 underline-offset-4 hover:underline">
                    {value}
                  </a>
                  <p className="mt-0.5 text-xs text-muted">{note}</p>
                </div>
              </li>
            ))}
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand">
                <MapPin size={17} strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Studio</p>
                {s.address.split("\n").map((line) => (
                  <p key={line} className="mt-1 text-ink/85">
                    {line}
                  </p>
                ))}
              </div>
            </li>
          </ul>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-line bg-white p-7">
            <Clock size={20} strokeWidth={1.3} />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Support Hours</p>
            <p className="mt-2 text-sm text-ink/75">{s.hours}</p>
            <p className="mt-1 text-sm text-ink/75">Messages sent outside these hours are answered the next working day.</p>
          </div>
          <Link href="/returns" className="group block rounded-3xl border border-line bg-white p-7 transition-colors hover:border-ink">
            <RotateCcw size={20} strokeWidth={1.3} />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Returns &amp; Exchanges</p>
            <p className="mt-2 text-sm text-ink/75">Need a different size or want to send something back? Start a request online.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]">
              Start a request <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </aside>
      </div>

      <section className="mx-auto mt-6 max-w-4xl rounded-3xl border border-line bg-white p-7 md:p-9">
        <h2 className="display text-2xl font-normal">Send Us a Message</h2>
        <p className="mb-6 mt-2 text-sm text-muted">Questions about a piece, an order or a gift? Write to us here.</p>
        <ContactForm />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, Hand, Layers, PenTool, ShieldCheck, Sparkles } from "lucide-react";
import { getCatalog } from "@/lib/server/catalog";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { RETURN_WINDOW_DAYS } from "@/lib/site";
import { Faq, type FaqGroup } from "./faq";

export const metadata: Metadata = {
  title: "Our Story",
  description: "TATTV means element. Discover the story and craft behind our men's jewellery.",
};

const FAQ: FaqGroup[] = [
  {
    id: "general",
    label: "General",
    items: [
      { q: "What does TATTV mean?", a: "Tattva means element: the essential nature of a thing. It is how we design, keeping only what matters in every piece." },
      { q: "Where are your pieces designed?", a: "Every piece is designed in our studio in India, then finished, checked and packed by hand in small batches." },
      { q: "Is TATTV jewellery only for men?", a: "Our designs are made with men in mind, but plenty of our customers wear them whoever they are. Wear what you like." },
    ],
  },
  {
    id: "orders",
    label: "Orders & Shipping",
    items: [
      { q: "How fast do you ship?", a: "Orders are dispatched within 24 hours, and the courier tracking link appears in your account and on your order page as soon as it ships." },
      { q: "Is shipping free?", a: `Shipping is complimentary and insured on orders above ${formatPrice(FREE_SHIPPING_THRESHOLD)}. Below that a small flat fee applies, shown at checkout.` },
      { q: "Do you offer cash on delivery?", a: "Yes. Choose cash on delivery at checkout and pay by cash or UPI when your parcel arrives." },
      { q: "Can I send a piece as a gift?", a: "Add gift packing at checkout: your order goes in the TATTV gift box with a handwritten message card, and no prices inside." },
    ],
  },
  {
    id: "returns",
    label: "Returns",
    items: [
      { q: "What is your return policy?", a: `Unworn pieces can be returned or exchanged within ${RETURN_WINDOW_DAYS} days of delivery, in their original packaging. Engraved or personalised pieces are final sale.` },
      { q: "How do I start a return or exchange?", a: "Message us on WhatsApp with your order number (there is a Help with this order link on every order in My Account). We arrange a free pickup." },
      { q: "When will I get my refund?", a: "Once the piece reaches us and is checked, the refund goes to your original payment method within 5–7 working days." },
    ],
  },
  {
    id: "care",
    label: "Care & Sizing",
    items: [
      { q: "Will my jewellery tarnish?", a: "Our steel and plated finishes are made for everyday wear. Keep them away from perfume and water, and wipe them with a soft cloth to keep the shine." },
      { q: "How do I find my ring size?", a: "Our Size Guide (in Help) explains how to measure a ring you already own or your finger. If you are between sizes, choose the larger one." },
      { q: "How should I care for leather?", a: "Wipe it with a soft, dry cloth, condition it every few months and keep it away from heat and long exposure to water." },
    ],
  },
];

export default async function AboutPage() {
  const catalog = await getCatalog();
  const STATS = [
    [String(catalog.products.length), "Pieces in the collection"],
    [String(catalog.categories.length), "Categories, ear to wallet"],
    ["24h", "Dispatch on every order"],
    [`${RETURN_WINDOW_DAYS}-day`, "Easy returns & exchanges"],
  ];

  return (
    <div className="bg-paper">
      {/* Intro: heading, then three staggered photos. */}
      <section className="container-x pb-14 pt-16 text-center md:pb-20 md:pt-20">
        <p className="eyebrow text-muted">Our Story</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-medium leading-[1.08] md:text-6xl">Jewellery with an essential nature</h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink/65">
          Modern and classic pieces for men, designed in India and made to be worn every day. Not louder, but deeper. Not trend, but character.
        </p>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-3 items-end gap-3 md:gap-5">
          {[
            { src: "/images/categories/arch/rings.jpg", alt: "A gold TATTV band ring on silk", label: "Designed in India", lift: false },
            { src: "/images/hero/hero-bg-new-one.jpg", alt: "Hands wearing a TATTV ring and bracelets", label: "Worn every day", lift: true, position: "object-[72%_center]" },
            { src: "/images/categories/arch/chains.jpg", alt: "A TATTV pendant on a box chain", label: "Finished by hand", lift: false },
          ].map((img) => (
            <div key={img.src} className={`relative overflow-hidden rounded-[1.75rem] shadow-soft ${img.lift ? "aspect-[4/5] md:-translate-y-6" : "aspect-[4/4.4]"}`}>
              <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 30vw, 33vw" className={`object-cover ${img.position ?? ""}`} />
              <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] backdrop-blur md:bottom-4 md:left-4">{img.label}</span>
            </div>
          ))}
        </div>

        {/* The name, then the numbers. */}
        <p className="mx-auto mt-14 max-w-3xl text-lg leading-relaxed text-ink/75 md:text-xl">
          <span className="font-serif text-2xl text-ink md:text-3xl" lang="te">
            తత్వ
          </span>{" "}
          <em>(tattva)</em> is the <b className="font-semibold text-ink">element</b> at the core of something: what remains when everything unnecessary is taken away. We design the same way, keeping only{" "}
          <b className="font-semibold text-ink">what matters</b>.
        </p>
        <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 overflow-hidden rounded-3xl border border-line bg-white shadow-soft md:grid-cols-4 md:divide-x md:divide-line">
          {STATS.map(([n, label]) => (
            <div key={label} className="px-4 py-6">
              <dt className="font-serif text-3xl font-medium">{n}</dt>
              <dd className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* How we make it, and the quality we keep: two alternating rows. */}
      <section className="bg-sand/60 py-16 md:py-24">
        <div className="container-x space-y-16 md:space-y-24">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink/70">How We Make It</span>
              <h2 className="mt-5 font-serif text-3xl font-medium md:text-4xl">From a sketch to your hand</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-ink/70">
                Every piece starts as a drawing in our studio. We make a sample, wear it for weeks and adjust it until it sits right, then finish each one by hand in small batches.
              </p>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                {[
                  { icon: PenTool, title: "Designed in-house", text: "Clean lines, refined until nothing is extra." },
                  { icon: Hand, title: "Finished by hand", text: "Polished, plated or oxidised one piece at a time." },
                ].map(({ icon: Icon, title, text }) => (
                  <li key={title}>
                    <Icon size={18} strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/60">{text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-soft">
                <Image src="/images/trends/trend-2.jpg" alt="An onyx signet ring being worn" fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
              </div>
              <div className="absolute -left-3 top-6 rounded-2xl bg-white/95 px-4 py-3 shadow-lift backdrop-blur md:-left-6">
                <p className="font-serif text-2xl font-medium">4 steps</p>
                <p className="text-xs text-muted">Sketch · Sample · Finish · Check</p>
              </div>
              <div className="absolute -bottom-4 right-6 rounded-2xl bg-white/95 px-4 py-3 shadow-lift backdrop-blur">
                <p className="font-serif text-2xl font-medium">Small</p>
                <p className="text-xs text-muted">batches, never mass-made</p>
              </div>
            </div>
          </div>

          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="relative md:order-none">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] shadow-soft">
                <Image src="/images/categories/arch/bracelets.jpg" alt="A gold TATTV bangle on a leather stand" fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
              </div>
              <blockquote className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 px-5 py-4 text-sm leading-relaxed shadow-lift backdrop-blur md:right-auto md:max-w-xs">
                &ldquo;If we wouldn&apos;t wear it every day ourselves, it doesn&apos;t leave the studio.&rdquo;
                <span className="mt-2 block text-[11px] uppercase tracking-[0.16em] text-muted">The TATTV Studio</span>
              </blockquote>
            </div>
            <div>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink/70">The Quality We Keep</span>
              <h2 className="mt-5 font-serif text-3xl font-medium md:text-4xl">Made to be worn, every day</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-ink/70">Good jewellery should outlast the moment you bought it. These are the promises behind every TATTV piece.</p>
              <ul className="mt-8 space-y-5">
                {[
                  { icon: ShieldCheck, title: "Built to last", text: "Stainless steel, gold plating and genuine leather, chosen for daily wear." },
                  { icon: Sparkles, title: "Checked one by one", text: "Every piece is inspected for finish, fit and clasp before it is packed." },
                  { icon: Gem, title: "Easy to care for", text: "Water-resistant finishes and simple care, so it keeps looking new." },
                  { icon: Layers, title: "Honest pricing", text: "No middlemen: designed, finished and sold by us." },
                ].map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-soft">
                      <Icon size={17} strokeWidth={1.5} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink/60">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Questions. */}
      <section className="container-x py-16 md:py-24">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow text-muted">Good to Know</p>
          <h2 className="mt-4 font-serif text-3xl font-medium md:text-5xl">Frequently asked questions</h2>
          <p className="mt-4 text-sm text-ink/60">Clear answers about our pieces, orders, returns and care.</p>
        </div>
        <Faq groups={FAQ} />
      </section>

      {/* Explore the collection. */}
      <section className="container-x pb-16 md:pb-24">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-sand p-8 md:grid-cols-[1.1fr_1fr] md:p-12">
          <div>
            <p className="eyebrow text-muted">The Collection</p>
            <h2 className="mt-4 font-serif text-3xl font-medium leading-tight md:text-5xl">Find the piece that feels like yours</h2>
            <p className="mt-4 max-w-md leading-relaxed text-ink/70">Earrings, chains, rings, bracelets and everyday leather, in modern and classic styles.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-dark">
                Shop the Collection <ArrowRight size={15} />
              </Link>
              <Link href="/collections" className="btn btn-outline">
                Modern &amp; Classic
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["earrings", "wallets", "rings"].map((c, i) => (
              <Link key={c} href={`/shop?category=${c}`} className={`relative block aspect-[3/4] overflow-hidden rounded-t-full shadow-soft ${i === 1 ? "md:-translate-y-4" : ""}`}>
                <Image src={`/images/categories/arch/${c}.jpg`} alt="" fill sizes="(min-width: 768px) 14vw, 30vw" className="object-cover transition-transform duration-700 hover:scale-105" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

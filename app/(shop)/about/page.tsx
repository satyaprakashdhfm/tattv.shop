import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, Hand, ShieldCheck, Sparkles } from "lucide-react";
import { COLLECTIONS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Our Story",
  description: "TATTV means element. Discover the story and craft behind our men's jewellery.",
};

const PILLARS = [
  { n: "01", icon: Sparkles, title: "Designed in India", text: "Every piece begins as a sketch in our studio, balancing modern architecture with classic detail." },
  { n: "02", icon: ShieldCheck, title: "Built to Last", text: "Premium stainless steel, gold plating and genuine leather, chosen to handle everyday wear." },
  { n: "03", icon: Hand, title: "Finished by Hand", text: "Each piece is polished, checked and packed by hand, in small batches." },
  { n: "04", icon: Gem, title: "Easy Care", text: "Water-resistant finishes and simple care, so your pieces look as good as the day they arrived." },
];

/** A photo for each collection: dark and architectural for Modern, warm light for Classic. */
const COLLECTION_PHOTOS: Record<string, { src: string; position: string }> = {
  modern: { src: "/images/trends/trend-1.jpg", position: "object-center" },
  classic: { src: "/images/banners/editorial-car.jpg", position: "object-[46%_center]" },
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
          <Image src="/brand/logo-white.png" alt="TATTV · Energize Your Style Element" width={1147} height={294} className="h-auto w-[260px] md:w-[380px]" priority />
          <p className="mt-12 max-w-2xl font-serif text-2xl font-light leading-relaxed text-white/80 md:text-3xl">
            <em>Tattva</em> (n.): an element; the essential nature of a thing.
          </p>
        </div>
      </section>

      {/* The story: warm sand band, text beside a two-photo collage. */}
      <section className="bg-sand">
        <div className="container-x grid items-center gap-14 py-20 md:py-28 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="eyebrow text-muted">Our Story</p>
            <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.08] md:text-5xl">Jewellery with an essential nature.</h1>
            <span className="mt-6 block h-px w-16 bg-ink/40" />
            <p className="mt-6 text-[17px] leading-relaxed text-ink/75">
              TATTV was born from a simple belief: what a man wears every day should mean something. Not louder, but deeper. Not trend, but character.
            </p>
            <p className="mt-4 leading-relaxed text-ink/70">
              We design two kinds of pieces. <strong className="font-medium text-ink">Modern</strong>, with clean architectural lines and bold oxidised finishes.
              <strong className="font-medium text-ink"> Classic</strong>, with polished steel and leather that age beautifully.
            </p>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {[
                ["100%", "Designed in India"],
                ["15-day", "Easy returns"],
                ["Small", "Batch finishing"],
              ].map(([n, label]) => (
                <div key={label} className="rounded-2xl bg-white/70 px-4 py-4 shadow-soft">
                  <dt className="font-serif text-2xl font-medium">{n}</dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-xl pb-16 pl-0 sm:pl-10">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift">
              <Image src="/images/hero/hero-bg-new-one.jpg" alt="Hands wearing a TATTV band ring and bracelet" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover object-[72%_center]" />
            </div>
            <div className="absolute bottom-0 left-0 w-[46%] overflow-hidden rounded-[1.5rem] border-[6px] border-sand shadow-lift">
              <div className="relative aspect-[3/4]">
                <Image src="/images/trends/trend-2.jpg" alt="An onyx signet ring worn on the hand" fill sizes="(min-width: 1024px) 18vw, 45vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The standard: dark band with four rounded cards. */}
      <section className="bg-ink py-20 text-white md:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-white/50">What every piece meets</p>
            <h2 className="mt-4 font-serif text-4xl font-medium md:text-5xl">The TATTV Standard</h2>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ n, icon: Icon, title, text }) => (
              <div key={n} className="group rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 transition-colors duration-300 hover:bg-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                  <span className="font-serif text-3xl text-white/25">{n}</span>
                </div>
                <h3 className="mt-8 text-[13px] font-semibold uppercase tracking-[0.18em]">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The collections: two large photo cards. */}
      <section className="bg-paper py-20 md:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-muted">Collections</p>
            <h2 className="mt-4 font-serif text-4xl font-medium md:text-5xl">Modern or classic. Or both.</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {COLLECTIONS.map((col) => {
              const photo = COLLECTION_PHOTOS[col.id];
              return (
                <Link key={col.id} href={`/shop?collection=${col.id}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[2rem] bg-ink shadow-soft md:aspect-[5/6]">
                  {photo && (
                    <Image src={photo.src} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className={`object-cover ${photo.position} transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-10">
                    <p className="eyebrow text-white/60">{col.tagline}</p>
                    <h3 className="mt-3 font-serif text-4xl font-medium md:text-5xl">{col.name}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">{col.blurb}</p>
                    <span className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[11px] font-medium uppercase tracking-[0.22em] text-ink transition-transform duration-300 group-hover:translate-x-1">
                      Shop {col.name} <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing band. */}
      <section className="container-x pb-20 md:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink text-white">
          <Image src="/images/banners/editorial.jpg" alt="" fill sizes="100vw" className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="relative max-w-xl px-7 py-16 md:px-14 md:py-24">
            <p className="eyebrow text-white/60">Find your element</p>
            <h2 className="mt-4 font-serif text-4xl font-medium leading-tight md:text-5xl">Made to be worn every day.</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-light">
                Shop All
              </Link>
              <Link href="/collections" className="btn btn-outline-light">
                Explore Collections
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

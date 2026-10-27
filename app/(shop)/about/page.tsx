import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COLLECTIONS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Our Story",
  description: "TATTV means element. Discover the story and craft behind our men's jewellery.",
};

const PILLARS = [
  { n: "01", title: "Designed in India", text: "Every piece begins as a sketch in our studio, balancing modern architecture with classic detail." },
  { n: "02", title: "Built to Last", text: "Premium stainless steel, gold plating and genuine leather, chosen to handle everyday wear." },
  { n: "03", title: "Finished by Hand", text: "Each piece is polished, checked and packed by hand, in small batches." },
  { n: "04", title: "Easy Care", text: "Water-resistant finishes and simple care, so your pieces look as good as the day they arrived." },
];

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

      <section className="container-x grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        <div className="max-w-lg">
          <p className="eyebrow text-muted">Our Story</p>
          <h1 className="title mt-3 text-xl md:text-2xl">Jewellery with an essential nature.</h1>
          <p className="mt-6 leading-relaxed text-muted">
            TATTV was born from a simple belief: what a man wears every day should mean something. Not louder, but deeper. Not trend, but character.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            We design two kinds of pieces. <strong className="font-medium text-ink">Modern</strong>, with clean architectural lines and bold oxidised finishes.
            <strong className="font-medium text-ink"> Classic</strong>, with polished steel and leather that age beautifully.
          </p>
        </div>
        <div className="relative aspect-[4/5] w-full max-w-lg justify-self-center overflow-hidden rounded-[2rem] bg-ink">
          <Image src="/images/categories/rings.jpg" alt="TATTV curb link rings" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container-x">
          <h2 className="title text-center text-xl md:text-2xl">The TATTV Standard</h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.n} className="border-t border-ink pt-6">
                <p className="font-serif text-3xl text-gold">{p.n}</p>
                <h3 className="eyebrow mt-4">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20 text-center md:py-28">
        <p className="eyebrow text-muted">Collections</p>
        <h2 className="title mt-3 text-xl md:text-2xl">Modern or classic. Or both.</h2>
        <div className="mx-auto mt-12 grid max-w-3xl gap-10 sm:grid-cols-2">
          {COLLECTIONS.map((col) => (
            <div key={col.id}>
              <p className="font-serif text-3xl">{col.name}</p>
              <p className="eyebrow mt-2 text-muted">{col.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{col.blurb}</p>
            </div>
          ))}
        </div>
        <Link href="/collections" className="btn btn-dark mt-12">
          Explore Collections
        </Link>
      </section>
    </>
  );
}

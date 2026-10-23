import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ELEMENTS, PRODUCTS } from "@/lib/products";
import { ProductArt } from "@/components/product-art";

export const metadata: Metadata = {
  title: "Our Story",
  description: "TATTV means element. Discover the story and craft behind our men's jewellery.",
};

const PILLARS = [
  { n: "01", title: "Designed in India", text: "Every piece begins as a sketch in our studio, balancing modern architecture with classic Indian symbolism." },
  { n: "02", title: "Certified Materials", text: "BIS hallmarked 925 sterling silver, thick 18K gold vermeil, surgical-grade steel and full-grain leather." },
  { n: "03", title: "Finished by Hand", text: "Each link is polished, each signet is set and each wallet edge is painted by hand, in small batches." },
  { n: "04", title: "Made to Last", text: "Lifetime complimentary polishing on all silver jewellery. Bring it back, and we'll make it new again." },
];

export default function AboutPage() {
  const agni = PRODUCTS.find((p) => p.element === "agni")!;
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
          <h1 className="display mt-3 text-5xl md:text-6xl">Jewellery with an essential nature.</h1>
          <p className="mt-6 leading-relaxed text-muted">
            TATTV was born from a simple belief: what a man wears every day should mean something. Not louder, but deeper. Not trend, but character.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            We design two kinds of pieces. <strong className="font-medium text-ink">Modern</strong>, with clean architectural lines and bold oxidised finishes.
            <strong className="font-medium text-ink"> Classic</strong>, with heritage links, signets and leather that age beautifully. Between them sits our
            signature series, Pancha Tattva, honouring the five elements of nature.
          </p>
        </div>
        <div className="aspect-square bg-sand">
          <ProductArt art={agni.art} tone="gold" className="h-full w-full" title={agni.name} />
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container-x">
          <h2 className="display text-center text-5xl">The TATTV Standard</h2>
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
        <p className="eyebrow text-muted">Pancha Tattva</p>
        <h2 className="display mt-3 text-5xl">Five elements. Find yours.</h2>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-5">
          {ELEMENTS.map((el) => (
            <div key={el.id}>
              <p className="font-serif text-2xl">{el.name}</p>
              <p className="eyebrow mt-1 text-muted">{el.english}</p>
              <p className="mt-2 text-sm text-muted">{el.meaning}</p>
            </div>
          ))}
        </div>
        <Link href="/shop?tag=elements" className="btn btn-dark mt-12">
          Shop Pancha Tattva
        </Link>
      </section>
    </>
  );
}

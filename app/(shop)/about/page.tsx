import type { Metadata } from "next";
import Image from "next/image";
import { Gem, Hand, PenTool, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Story",
  description: "TATTV means element. Discover the story and craft behind our men's jewellery.",
};

/** What we promise about every piece. */
const PROMISES = [
  { n: "01", icon: PenTool, title: "Designed in India", text: "Every piece begins as a sketch in our studio, balancing modern lines with classic detail." },
  { n: "02", icon: ShieldCheck, title: "Built to Last", text: "Stainless steel, gold plating and genuine leather, chosen to handle everyday wear." },
  { n: "03", icon: Hand, title: "Finished by Hand", text: "Each piece is polished, checked and packed by hand, in small batches." },
  { n: "04", icon: Gem, title: "Easy Care", text: "Water-resistant finishes and simple care, so it looks as good as the day it arrived." },
];

/** How a piece goes from idea to your door. */
const MAKING = [
  { step: "Sketch", text: "An idea drawn by hand, refined until nothing is extra." },
  { step: "Sample", text: "A first piece made and worn for weeks, then adjusted." },
  { step: "Finish", text: "Polished, plated or oxidised by hand, in small batches." },
  { step: "Check & Pack", text: "Inspected one by one and boxed, ready to be worn." },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-x flex min-h-[46vh] flex-col items-center justify-center py-20 text-center">
          <Image src="/brand/logo-white.png" alt="TATTV · Energize Your Style Element" width={1147} height={294} className="h-auto w-[240px] md:w-[340px]" priority />
          <p className="mt-10 max-w-2xl font-serif text-2xl font-light leading-relaxed text-white/80 md:text-3xl">
            <em>Tattva</em> (n.): an element; the essential nature of a thing.
          </p>
        </div>
      </section>

      {/* The story: text beside a single photo. */}
      <section className="bg-paper">
        <div className="container-x grid items-center gap-12 py-20 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="eyebrow text-muted">Our Story</p>
            <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] md:text-5xl">Jewellery with an essential nature.</h1>
            <span className="mt-6 block h-px w-16 bg-ink/30" />
            <p className="mt-6 text-[17px] leading-relaxed text-ink/75">
              TATTV was born from a simple belief: what a man wears every day should mean something. Not louder, but deeper. Not trend, but character.
            </p>
            <p className="mt-4 leading-relaxed text-ink/70">
              So we keep it simple. Clean lines, honest materials and pieces that feel right from the first day you wear them to the thousandth.
            </p>
            <dl className="mt-10 grid max-w-md grid-cols-3 divide-x divide-line border-y border-line">
              {[
                ["100%", "Designed in India"],
                ["15-day", "Easy returns"],
                ["Small", "Batch finishing"],
              ].map(([n, label]) => (
                <div key={label} className="px-4 py-5 first:pl-0">
                  <dt className="font-serif text-2xl font-medium">{n}</dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] shadow-soft">
            <Image src="/images/hero/hero-bg-new-one.jpg" alt="Hands wearing a TATTV band ring and bracelet" fill sizes="(min-width: 1024px) 36vw, 90vw" className="object-cover object-[72%_center]" />
          </div>
        </div>
      </section>

      {/* The name, in Telugu and English. */}
      <section className="bg-sand">
        <div className="container-x py-16 text-center md:py-20">
          <p className="font-serif text-5xl leading-none md:text-6xl" lang="te">
            తత్వ
          </p>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink/70">
            In Sanskrit and Telugu, <em>tattva</em> is the element at the core of something: what remains when everything unnecessary is taken away. That is how we design.
          </p>
        </div>
      </section>

      {/* Our promise: four points on a light background, separated by fine rules. */}
      <section className="bg-paper py-20 md:py-24">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-muted">Our Promise</p>
            <h2 className="mt-4 font-serif text-4xl font-medium md:text-5xl">In every piece we make</h2>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line">
            {PROMISES.map(({ n, icon: Icon, title, text }) => (
              <div key={n} className="text-center lg:px-8">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-line bg-white">
                  <Icon size={20} strokeWidth={1.4} />
                </span>
                <p className="mt-5 text-[11px] tracking-[0.3em] text-muted">{n}</p>
                <h3 className="mt-2 text-[13px] font-semibold uppercase tracking-[0.18em]">{title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it's made: four steps joined by a line. */}
      <section className="border-t border-line bg-paper pb-24 pt-20 md:pt-24">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-muted">From Sketch to You</p>
            <h2 className="mt-4 font-serif text-4xl font-medium md:text-5xl">How a piece is made</h2>
          </div>
          <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
            <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[19px] hidden h-px bg-line md:block" />
            {MAKING.map(({ step, text }, i) => (
              <li key={step} className="relative text-center">
                <span className="relative mx-auto flex size-10 items-center justify-center rounded-full bg-ink text-[12px] font-medium text-white">{i + 1}</span>
                <h3 className="mt-5 text-[13px] font-semibold uppercase tracking-[0.18em]">{step}</h3>
                <p className="mx-auto mt-2 max-w-[15rem] text-sm leading-relaxed text-ink/65">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

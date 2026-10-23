import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, PRODUCTS } from "@/lib/products";
import { ProductRail } from "@/components/product-rail";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";

export default function HomePage() {
  const newArrivals = PRODUCTS.filter((p) => p.isNew).concat(PRODUCTS.filter((p) => !p.isNew)).slice(0, 8);
  const bestsellers = PRODUCTS.filter((p) => p.bestseller).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#e7ddd0]">
        {/* Full-width photo; below lg it sits above the copy, from lg up the copy overlays its left side. */}
        <div className="relative aspect-[16/9] lg:aspect-auto lg:h-[min(64vh,580px)] lg:min-h-[460px]">
          <Image
            src="/images/hero/hero-bg.jpg"
            alt="Man in a black suit wearing a TATTV chain, curb bracelet and onyx ring, holding a leather wallet"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[75%_25%]"
          />
          <div className="absolute inset-y-0 left-0 hidden w-3/5 bg-gradient-to-r from-[#e7ddd0]/85 via-[#e7ddd0]/45 to-transparent lg:block" />
        </div>
        <div className="container-x lg:absolute lg:inset-0 lg:flex lg:items-center">
          <div className="max-w-lg animate-fade-in py-10 lg:max-w-[400px] lg:py-0 xl:max-w-lg">
            <h1 className="title text-3xl leading-[1.15] tracking-[0.04em] lg:text-[42px]">
              More than accessories.
              <br />
              <span className="font-normal">It&apos;s your signature.</span>
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink/75">
              Chains, rings, bracelets and everyday essentials designed to define your style.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-dark">
                Shop the Collection
              </Link>
              <Link href="/collections" className="btn btn-outline">
                Discover Your Style
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by category */}
      <section className="pb-4 pt-16 md:pb-6 md:pt-20">
        <h2 className="title mb-8 text-center text-lg md:mb-10 md:text-xl">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-2.5 px-2.5 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`} className="group relative block aspect-[3/4] overflow-hidden bg-ink">
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute inset-x-0 bottom-7 text-center text-white md:bottom-9">
                <span className="underline-reveal whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.06em] md:text-[13px]">Shop {c.name}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="py-16 md:py-20">
        <div className="container-x">
          <SectionHeading title="New Arrivals" href="/shop?tag=new" />
          <ProductRail products={newArrivals} />
        </div>
      </section>

      {/* Bestsellers */}
      <section className="container-x py-16 md:py-20">
        <SectionHeading title="Bestsellers" href="/shop?tag=bestseller" />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Brand story */}
      <section className="border-t border-line bg-white">
        <div className="container-x grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
          <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center bg-ink">
            <Image src="/brand/mark-white.png" alt="TATTV emblem" width={253} height={294} className="h-auto w-1/3" />
          </div>
          <div className="max-w-lg">
            <p className="eyebrow text-muted">Our Story</p>
            <h2 className="title mt-3 text-xl md:text-2xl">Two elements. One form.</h2>
            <p className="mt-6 leading-relaxed text-muted">
              Our emblem is two interlocking T&apos;s held within a frame: the modern and the classic, the self and the style. TATTV was founded on the idea that what
              a man wears every day should carry meaning, weight and craft.
            </p>
            <p className="mt-4 leading-relaxed text-muted">Every piece is designed in India, quality-checked by hand and packed in our signature pouch.</p>
            <Link href="/about" className="btn btn-outline mt-8">
              Discover TATTV
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

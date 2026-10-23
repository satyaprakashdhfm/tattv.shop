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
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="container-x grid min-h-[min(78vh,820px)] items-center gap-10 py-14 lg:grid-cols-2 lg:py-16">
          <div className="relative z-10 max-w-xl animate-fade-in">
            <p className="eyebrow mb-6 text-white/60">The Men&apos;s Edit · Autumn 2026</p>
            <h1 className="display text-5xl font-normal sm:text-6xl xl:text-7xl">
              Energize your
              <br />
              <em className="font-light">style element.</em>
            </h1>
            <p className="mt-6 max-w-md text-base font-light leading-relaxed text-white/70">
              Modern and classic jewellery for men: chains, rings, bracelets and leather wallets, made to be worn every day.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/shop" className="btn btn-light">
                Shop Men&apos;s
              </Link>
              <Link href="/collections" className="btn btn-outline-light">
                Explore Collections
              </Link>
            </div>
          </div>
          <Link href="/product/twin-cable-bangle" className="group relative mx-auto block aspect-[4/5] w-full max-w-[520px] overflow-hidden" aria-label="Twin Cable Bangle">
            <Image
              src="/images/hero/cable-bangle.jpg"
              alt="TATTV Twin Cable Bangle on black satin"
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover transition-transform duration-[1.5s] group-hover:scale-[1.03]"
            />
          </Link>
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

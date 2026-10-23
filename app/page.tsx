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
      <section className="relative h-[520px] overflow-hidden bg-ink text-white sm:h-[560px] lg:h-[min(72vh,640px)] lg:min-h-[520px]">
        <Image
          src="/images/hero/hero-bg-new.jpg"
          alt="Man at sunset wearing a TATTV chain, bracelets and onyx ring, holding a leather wallet"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_45%] lg:object-[50%_45%]"
        />
        {/* No overlay on the photo: the copy carries its own soft shadow so the jewellery stays clearly visible. */}
        <div className="container-x absolute inset-0 flex flex-col items-center justify-center pt-10 text-center [text-shadow:0_1px_3px_rgba(0,0,0,0.6),0_2px_18px_rgba(0,0,0,0.55)]">
          <p className="eyebrow animate-fade-in font-semibold text-white">The Men&apos;s Collection</p>
          <h1 className="display mt-4 max-w-3xl animate-fade-in text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-[46px]">
            Chains, rings, bracelets and everyday essentials designed to define your style.
          </h1>
          <Link href="/shop" className="btn mt-8 h-11 animate-fade-in border border-white bg-white text-ink [text-shadow:none] hover:bg-ink hover:text-white hover:border-ink">
            Discover the Collection
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      <section className="pb-5 pt-10 md:pb-6 md:pt-12">
        <div className="container-x">
          <SectionHeading title="New Arrivals" href="/shop?tag=new" />
          <ProductRail products={newArrivals} cta="discover" />
        </div>
      </section>

      {/* Shop by category */}
      <section className="py-5 md:py-6">
        <h2 className="title mb-6 text-center text-lg md:mb-7 md:text-xl">Shop by Category</h2>
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

      {/* Bestsellers */}
      <section className="container-x pb-12 pt-5 md:pb-14 md:pt-6">
        <SectionHeading title="Bestsellers" href="/shop?tag=bestseller" />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Brand story */}
      <section className="border-t border-line bg-white">
        <div className="container-x grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2">
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

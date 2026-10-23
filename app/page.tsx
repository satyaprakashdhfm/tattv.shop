import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, PenTool, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { CATEGORIES, COLLECTIONS, ELEMENTS, PRODUCTS, getProduct, unitPrice, type Art, type Tone } from "@/lib/products";
import { ProductArt } from "@/components/product-art";
import { ProductRail } from "@/components/product-rail";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";

const CATEGORY_ART: Record<string, { art: Art; tone: Tone }> = {
  chains: { art: { kind: "chain", style: "cable", pendant: "triangle" }, tone: "silver" },
  rings: { art: { kind: "ring", style: "signet" }, tone: "gold" },
  bracelets: { art: { kind: "bracelet", style: "curb" }, tone: "silver" },
  wallets: { art: { kind: "wallet", style: "bifold" }, tone: "leather-brown" },
};

const SERVICES = [
  { icon: Truck, title: "Complimentary Shipping", text: `On all orders above ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
  { icon: RotateCcw, title: "15-Day Returns", text: "Easy exchanges & refunds" },
  { icon: ShieldCheck, title: "Hallmarked Silver", text: "BIS certified 925 sterling" },
  { icon: PenTool, title: "Free Engraving", text: "Make it unmistakably yours" },
];

export default function HomePage() {
  const newArrivals = PRODUCTS.filter((p) => p.isNew).concat(PRODUCTS.filter((p) => !p.isNew)).slice(0, 8);
  const bestsellers = PRODUCTS.filter((p) => p.bestseller).slice(0, 8);
  const heroProduct = getProduct("agni-triangle-pendant")!;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="container-x grid min-h-[min(78vh,820px)] items-center gap-8 py-14 lg:grid-cols-2 lg:py-0">
          <div className="relative z-10 max-w-xl animate-fade-in">
            <p className="eyebrow mb-6 text-white/60">The Men&apos;s Edit · Autumn 2026</p>
            <h1 className="display text-5xl sm:text-6xl xl:text-7xl">
              Energize your
              <br />
              <em className="font-light">style element.</em>
            </h1>
            <p className="mt-6 max-w-md text-base font-light leading-relaxed text-white/70">
              Modern and classic jewellery for men: chains, pendants, rings, bracelets and fine leather, crafted in sterling silver and gold.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/shop" className="btn btn-light">
                Shop Men&apos;s
              </Link>
              <Link href="/shop?tag=elements" className="btn btn-outline-light">
                Discover Pancha Tattva
              </Link>
            </div>
          </div>
          <Link href={`/product/${heroProduct.slug}`} className="group relative mx-auto aspect-square w-full max-w-[620px]" aria-label={heroProduct.name}>
            <ProductArt art={heroProduct.art} tone="silver" backdrop="dark" className="h-full w-full transition-transform duration-[1.5s] group-hover:scale-[1.03]" title={heroProduct.name} />
            <span className="absolute bottom-4 right-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/70 group-hover:text-white">
              {heroProduct.name} <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </section>

      {/* Services strip */}
      <section className="border-b border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-y-6 py-7 lg:grid-cols-4">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 lg:justify-center">
              <Icon size={22} strokeWidth={1.2} className="shrink-0" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em]">{title}</p>
                <p className="text-xs text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow="Shop by Category" title="The Essentials" center />
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`} className="group">
              <div className="aspect-[4/5] overflow-hidden bg-sand">
                <ProductArt art={CATEGORY_ART[c.id].art} tone={CATEGORY_ART[c.id].tone} className="h-full w-full transition-transform duration-700 group-hover:scale-105" title={c.name} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h3 className="font-serif text-xl md:text-2xl">{c.name}</h3>
                <ArrowRight size={16} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-1 hidden text-sm text-muted md:block">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="bg-white py-20 md:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="Just In" title="New Arrivals" href="/shop?tag=new" />
          <ProductRail products={newArrivals} />
        </div>
      </section>

      {/* Modern / Classic */}
      <section className="grid md:grid-cols-2">
        {COLLECTIONS.map((col) => {
          const dark = col.id === "modern";
          const feature = getProduct(dark ? "monogram-t-pendant" : "heritage-signet-ring")!;
          return (
            <Link
              key={col.id}
              href={`/shop?collection=${col.id}`}
              className={`group relative flex min-h-[560px] flex-col justify-end overflow-hidden p-8 md:min-h-[720px] md:p-14 ${dark ? "bg-ink text-white" : "bg-sand-dark text-ink"}`}
            >
              <div className="absolute inset-x-0 top-0 h-[62%] overflow-hidden">
                <ProductArt
                  art={feature.art}
                  tone={dark ? "silver" : "gold"}
                  backdrop={dark ? "dark" : "none"}
                  className="h-full w-full transition-transform duration-[1.5s] group-hover:scale-105"
                  title={feature.name}
                />
              </div>
              <div className="relative z-10 max-w-sm">
                <p className={`eyebrow mb-3 ${dark ? "text-white/60" : "text-muted"}`}>The {col.name} Collection</p>
                <h2 className="display text-5xl md:text-6xl">{col.tagline}</h2>
                <p className={`mt-4 text-sm leading-relaxed ${dark ? "text-white/70" : "text-ink/70"}`}>{col.blurb}</p>
                <span className={`btn mt-8 ${dark ? "btn-light" : "btn-dark"}`}>Shop {col.name}</span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Pancha Tattva */}
      <section className="bg-ink py-20 text-white md:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <Image src="/brand/mark-white.png" alt="" width={253} height={294} className="mx-auto h-auto w-10" />
            <p className="eyebrow mt-6 text-white/60">Signature Series</p>
            <h2 className="display mt-3 text-5xl md:text-6xl">Pancha Tattva</h2>
            <p className="mt-5 font-light leading-relaxed text-white/70">
              <em>Tattva</em> means element. Our signature pendants honour the five elements of nature, each one a symbol to carry close: earth, water, fire, air and space.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {ELEMENTS.map((el) => {
              const p = PRODUCTS.find((x) => x.element === el.id)!;
              return (
                <Link key={el.id} href={`/product/${p.slug}`} className="group text-center">
                  <div className="aspect-square overflow-hidden">
                    <ProductArt art={p.art} tone="silver" view="detail" backdrop="dark" className="h-full w-full transition-transform duration-700 group-hover:scale-110" title={p.name} />
                  </div>
                  <p className="mt-4 font-serif text-2xl">{el.name}</p>
                  <p className="eyebrow mt-1 text-white/50">
                    {el.english} · {el.meaning}
                  </p>
                </Link>
              );
            })}
          </div>
          <div className="mt-14 text-center">
            <Link href="/shop?tag=elements" className="btn btn-outline-light">
              Find Your Element
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow="Most Loved" title="Bestsellers" href="/shop?tag=bestseller" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Gifting */}
      <section className="container-x pb-20 md:pb-28">
        <div className="grid overflow-hidden bg-sand md:grid-cols-2">
          <div className="flex flex-col justify-center p-10 md:p-16">
            <Gift size={28} strokeWidth={1.2} />
            <p className="eyebrow mt-6 text-muted">The Gift Edit</p>
            <h2 className="display mt-3 text-5xl">Gifts he&apos;ll actually wear.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Thoughtful pieces under {formatPrice(4999)}, each one arriving in our signature black gift box with a handwritten note.
            </p>
            <div className="mt-8">
              <Link href="/shop?tag=gifts" className="btn btn-dark">
                Shop Gifts
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2">
            {(["onyx-bead-bracelet", "slim-card-holder", "arrow-pendant", "classic-band-6mm"] as const).map((slug) => {
              const p = getProduct(slug)!;
              return (
                <Link key={slug} href={`/product/${slug}`} className="group relative aspect-square overflow-hidden border-l border-t border-white/60">
                  <ProductArt art={p.art} tone={p.options[0].tone} backdrop="none" className="h-full w-full transition-transform duration-700 group-hover:scale-105" title={p.name} />
                  <span className="absolute bottom-3 left-3 text-[11px] uppercase tracking-[0.14em]">{formatPrice(unitPrice(p))}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="border-t border-line bg-white">
        <div className="container-x grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
          <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center bg-ink">
            <Image src="/brand/mark-white.png" alt="TATTV emblem" width={253} height={294} className="h-auto w-1/3" />
          </div>
          <div className="max-w-lg">
            <p className="eyebrow text-muted">Our Story</p>
            <h2 className="display mt-3 text-5xl">Two elements. One form.</h2>
            <p className="mt-6 leading-relaxed text-muted">
              Our emblem is two interlocking T&apos;s held within a frame: the modern and the classic, the self and the style. TATTV was founded on the idea that what
              a man wears every day should carry meaning, weight and craft.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              Every piece is designed in India, cast in certified 925 sterling silver or cut from full-grain leather, and finished by hand.
            </p>
            <Link href="/about" className="btn btn-outline mt-8">
              Discover TATTV
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

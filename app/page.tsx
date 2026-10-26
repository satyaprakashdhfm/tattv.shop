import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, PRODUCTS } from "@/lib/products";
import { ProductRail } from "@/components/product-rail";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { EditorialBanner } from "@/components/editorial-banner";
import { TrendPanels } from "@/components/trend-panels";
import { TRENDS } from "@/lib/trends";
import { JewelleryLookZoom } from "@/components/jewellery-look-zoom";

export default function HomePage() {
  const newArrivals = PRODUCTS.filter((p) => p.isNew).concat(PRODUCTS.filter((p) => !p.isNew)).slice(0, 8);
  const bestsellers = PRODUCTS.filter((p) => p.bestseller).slice(0, 4);

  return (
    <>
      {/* Hero: shop-the-look camera over one model photo (scroll steps through each piece). */}
      <JewelleryLookZoom />

      {/* New arrivals */}
      <section className="pb-2 pt-10 md:pt-12">
        <div className="container-x">
          <SectionHeading title="New Arrivals" href="/shop?tag=new" />
          <ProductRail products={newArrivals} cta="discover" />
        </div>
      </section>

      {/* Editorial campaign banner */}
      <EditorialBanner
        className="mt-2"
        image="/images/banners/editorial.jpg"
        alt="TATTV steel and gold cable bangles arranged on dark stone"
        eyebrow="The Steel Edit"
        title="Built for every day. Made to last."
        cta="Shop the Edit"
        href="/shop"
      />

      {/* Shop by category */}
      <section className="pb-5 pt-10 md:pb-6 md:pt-12">
        <h2 className="title mb-6 text-center text-lg md:mb-7 md:text-xl">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-2.5 px-2.5 md:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`} className="group relative block aspect-[3/4] overflow-hidden bg-ink last:col-span-2 last:aspect-[2/1] md:last:col-span-1 md:last:aspect-[3/4]">
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(min-width: 768px) 20vw, 50vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute inset-x-0 bottom-7 px-3 text-center text-white md:bottom-9">
                <span className="underline-reveal text-[12px] font-semibold uppercase tracking-[0.06em] md:text-[13px]">{c.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Second editorial banner */}
      <EditorialBanner
        className="mt-6 md:mt-8"
        image="/images/banners/editorial-car.jpg"
        alt="Man in a dark suit opening a car door, wearing TATTV gold signet rings and stacked bracelets"
        eyebrow="The Signature Edit"
        title="Arrive like you mean it."
        cta="Shop Rings"
        href="/shop?category=rings"
        ratio="lg:aspect-[5/2]"
        position="object-[52%_55%] sm:object-[55%_50%] lg:object-center"
      />

      {/* Styling guide: worn photos with zoomed close-ups of each piece */}
      <TrendPanels title="Style Your Element" panels={TRENDS} />

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

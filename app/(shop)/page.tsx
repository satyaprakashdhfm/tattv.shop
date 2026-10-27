import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCatalog } from "@/lib/server/catalog";
import { ProductRail } from "@/components/product-rail";
import { ProductCard } from "@/components/product-card";
import { HeadingRule, SectionHeading } from "@/components/section-heading";
import { EditorialBanner } from "@/components/editorial-banner";
import { JewelleryLookZoom } from "@/components/jewellery-look-zoom";
import { ReviewsSection } from "@/components/reviews-section";
import { InstagramReels } from "@/components/instagram-reels";

export default async function HomePage() {
  const { products: PRODUCTS, categories: CATEGORIES } = await getCatalog();
  const newArrivals = PRODUCTS.filter((p) => p.isNew).concat(PRODUCTS.filter((p) => !p.isNew)).slice(0, 8);
  const bestsellers = PRODUCTS.filter((p) => p.bestseller).slice(0, 4);

  return (
    <>
      {/* Hero: shop-the-look camera over one model photo (scroll steps through each piece). */}
      <JewelleryLookZoom />

      {/* New arrivals */}
      <section className="pt-14 md:pt-20">
        <div className="container-x">
          <SectionHeading title="New Arrivals" href="/shop?tag=new" />
          <ProductRail products={newArrivals} cta="discover" />
        </div>
      </section>

      {/* Editorial campaign banner */}
      <EditorialBanner
        className="mt-10 md:mt-12"
        image="/images/banners/editorial.jpg"
        alt="TATTV steel and gold cable bangles arranged on dark stone"
        eyebrow="The Steel Edit"
        title="Built for every day. Made to last."
        cta="Shop the Edit"
        href="/shop"
      />

      {/* Shop by category: arch-topped photos with the name and an arrow beneath */}
      <section className="container-x pt-14 md:pt-20">
        <div className="mb-8 md:mb-10">
          <HeadingRule title="Shop by Category" />
        </div>
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 md:mx-0 md:grid md:auto-cols-fr md:grid-flow-col md:gap-6 md:overflow-visible md:px-0 lg:gap-8">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`} className="group block w-[42%] shrink-0 snap-start text-center sm:w-[30%] md:w-auto">
              <span className="relative block aspect-[3/4] overflow-hidden rounded-t-full bg-sand">
                {c.image && (
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    sizes="(min-width: 768px) 20vw, 42vw"
                    className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
                  />
                )}
              </span>
              <span className="title mt-4 block text-[13px] md:text-sm">{c.title}</span>
              <span className="mx-auto mt-2 flex w-14 items-center text-ink/60 transition-all duration-300 group-hover:w-20 group-hover:text-ink">
                <span className="h-px flex-1 bg-current" />
                <ChevronRight size={12} strokeWidth={1.5} className="-ml-1.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="container-x pb-8 pt-14 md:pb-10 md:pt-20">
        <SectionHeading title="Bestsellers" href="/shop?tag=bestseller" />
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Instagram reels, auto-scrolling */}
      <InstagramReels />

      {/* Customer reviews (placeholder content, see lib/reviews.ts) */}
      <ReviewsSection />
    </>
  );
}

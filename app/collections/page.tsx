import type { Metadata } from "next";
import Link from "next/link";
import { COLLECTIONS, PRODUCTS } from "@/lib/products";
import { ProductArt } from "@/components/product-art";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore the TATTV Modern and Classic collections.",
};

export default function CollectionsPage() {
  return (
    <>
      <section className="border-b border-line bg-sand">
        <div className="container-x py-16 text-center">
          <p className="eyebrow text-muted">Collections</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">Modern & Classic</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">Two sensibilities, one standard of craft. Choose your style element, or wear both.</p>
        </div>
      </section>

      {COLLECTIONS.map((col, i) => {
        const items = PRODUCTS.filter((p) => p.collection === col.id);
        const hero = items.find((p) => p.bestseller) ?? items[0];
        const dark = col.id === "modern";
        return (
          <section key={col.id} className={i % 2 ? "bg-white" : ""}>
            <div className="container-x py-20 md:py-24">
              <div className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className={`aspect-[4/3] overflow-hidden ${dark ? "bg-ink" : "bg-sand-dark"}`}>
                  <ProductArt art={hero.art} tone={dark ? "silver" : "gold"} backdrop={dark ? "dark" : "none"} className="h-full w-full" title={hero.name} />
                </div>
                <div className="max-w-md">
                  <p className="eyebrow text-muted">The {col.name} Collection</p>
                  <h2 className="display mt-3 text-5xl">{col.tagline}</h2>
                  <p className="mt-4 leading-relaxed text-muted">{col.blurb}</p>
                  <Link href={`/shop?collection=${col.id}`} className="btn btn-dark mt-8">
                    Shop {col.name} ({items.length})
                  </Link>
                </div>
              </div>
              <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
                {items.slice(0, 4).map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

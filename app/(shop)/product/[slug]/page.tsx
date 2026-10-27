import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/server/catalog";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { ProductDetail } from "./product-detail";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getCatalog()).getProduct(slug);
  if (!product) return { title: "Not found" };
  return { title: product.name, description: product.short };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { getProduct, categoryName, related } = await getCatalog();
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <>
      <div className="bg-cream">
        <div className="container-x pt-6">
          <nav className="text-xs text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-espresso">
              Home
            </Link>
            <span className="mx-2 text-warm-line">/</span>
            <Link href={`/shop?category=${product.category}`} className="hover:text-espresso">
              {categoryName(product.category)}
            </Link>
            <span className="mx-2 text-warm-line">/</span>
            <span className="text-espresso">{product.name}</span>
          </nav>
        </div>

        <ProductDetail key={product.slug} product={product} />
      </div>

      <section className="border-t border-line bg-white">
        <div className="container-x py-20">
          <SectionHeading title="You May Also Like" href={`/shop?category=${product.category}`} cta="View More" />
          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {related(product).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, categoryName, getProduct, relatedProducts } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { ProductDetail } from "./product-detail";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ option?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Not found" };
  return { title: product.name, description: product.short };
}

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { option } = await searchParams;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <>
      <div className="container-x pt-6">
        <nav className="text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-ink">
            {categoryName(product.category)}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <ProductDetail key={`${product.slug}-${option ?? ""}`} product={product} initialOptionId={option} />

      <section className="border-t border-line bg-white">
        <div className="container-x py-20">
          <SectionHeading eyebrow="Complete the Look" title="You May Also Like" href={`/shop?category=${product.category}`} cta="View More" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {relatedProducts(product).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

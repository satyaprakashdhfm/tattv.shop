import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/server/catalog";
import { SITE_URL } from "@/lib/site";
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
  const description = product.short || product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { type: "website", title: product.name, description, url: `/product/${product.slug}`, images: product.images.slice(0, 4).map((url) => ({ url, alt: product.name })) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { getProduct, categoryName, related } = await getCatalog();
  const product = getProduct(slug);
  if (!product) notFound();

  // Product details for Google's rich results (price, stock, photos), from the live catalogue.
  const abs = (u: string) => (u.startsWith("http") ? u : SITE_URL + u);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short || product.description,
    image: product.images.map(abs),
    sku: product.slug,
    brand: { "@type": "Brand", name: "TATTV" },
    category: categoryName(product.category),
    material: product.material || undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "TATTV" },
    },
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: categoryName(product.category), item: `${SITE_URL}/shop?category=${product.category}` },
      { "@type": "ListItem", position: 3, name: product.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, crumbs]).replace(/</g, "\\u003c") }} />
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

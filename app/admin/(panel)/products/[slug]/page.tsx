import { notFound } from "next/navigation";
import { loadCatalogData, loadCosts } from "@/lib/server/catalog";
import { PageHead } from "../../ui";
import { ProductForm } from "../product-form";
import { defaultShippingReturns } from "@/lib/product-copy";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props) {
  return { title: `Edit ${(await params).slug}` };
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const [{ products, categories, settings }, costs] = await Promise.all([loadCatalogData(), loadCosts()]);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <>
      <PageHead back={{ href: "/admin/products", label: "Products" }} title={product.name} />
      <ProductForm product={product} cost={costs.get(slug)} categories={categories} standardShipping={defaultShippingReturns(settings)} savedNotice={!!sp.saved} />
    </>
  );
}

import { notFound } from "next/navigation";
import { loadCatalogData } from "@/lib/server/catalog";
import { PageHead } from "../../ui";
import { ProductForm } from "../product-form";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props) {
  return { title: `Edit ${(await params).slug}` };
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { products, categories } = await loadCatalogData();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <>
      <PageHead back={{ href: "/admin/products", label: "Products" }} title={product.name} />
      <ProductForm product={product} categories={categories} savedNotice={!!sp.saved} />
    </>
  );
}

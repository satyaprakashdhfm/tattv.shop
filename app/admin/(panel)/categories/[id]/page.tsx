import { notFound } from "next/navigation";
import { loadCatalogData } from "@/lib/server/catalog";
import { PageHead } from "../../ui";
import { CategoryForm } from "../category-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: `Edit ${(await params).id}` };
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const { categories, products } = await loadCatalogData();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();
  return (
    <>
      <PageHead back={{ href: "/admin/categories", label: "Categories" }} title={category.name} />
      <CategoryForm category={category} productCount={products.filter((p) => p.category === id).length} />
    </>
  );
}

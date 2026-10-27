import { loadCatalogData } from "@/lib/server/catalog";
import { PageHead } from "../../ui";
import { ProductForm } from "../product-form";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { categories } = await loadCatalogData();
  return (
    <>
      <PageHead back={{ href: "/admin/products", label: "Products" }} title="Add a Product" />
      <ProductForm categories={categories} />
    </>
  );
}

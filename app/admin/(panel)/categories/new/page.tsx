import { PageHead } from "../../ui";
import { CategoryForm } from "../category-form";

export const metadata = { title: "Add category" };

export default function NewCategoryPage() {
  return (
    <>
      <PageHead back={{ href: "/admin/categories", label: "Categories" }} title="Add a Category" />
      <CategoryForm />
    </>
  );
}

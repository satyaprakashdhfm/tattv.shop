import Image from "next/image";
import Link from "next/link";
import { loadCatalogData } from "@/lib/server/catalog";
import { moveCategoryAction } from "../../actions";
import { PageHead } from "../ui";
import { ClickRow } from "../click-row";
import { Modal } from "../modal";
import { CategoryForm } from "./category-form";

export const metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { categories, products } = await loadCatalogData();
  const count = (id: string) => products.filter((p) => p.category === id).length;
  const editing = sp.edit === "new" ? "new" : categories.find((c) => c.id === sp.edit);

  return (
    <>
      <PageHead title="Categories">
        <Link href="/admin/categories?edit=new" scroll={false} className="btn btn-dark btn-sm">
          + Add Category
        </Link>
      </PageHead>
      {sp.deleted && <p className="adm-ok">Category deleted.</p>}
      {sp.saved && <p className="adm-ok">Category saved. Changes are live on the store.</p>}

      <p className="adm-note">
        This is the order of the arches in <b className="font-medium">Shop by Category</b> on the home page, and of the category filters on the Shop page. The photo here is the one shown in the arch.
        To change the order of products <i>inside</i> a category, go to{" "}
        <Link href="/admin/products" className="underline underline-offset-2">
          Products
        </Link>{" "}
        and pick the category.
      </p>

      <div className="adm-card overflow-hidden overflow-x-auto !p-0">
        <table className="adm-table">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Category</th>
              <th className="hidden md:table-cell">Title on the home page</th>
              <th className="text-right">Products</th>
              <th className="text-right">Order</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c, i) => (
              <ClickRow key={c.id} href={`/admin/categories?edit=${c.id}`}>
                <td className="text-muted">{i + 1}</td>
                <td>
                  <Link href={`/admin/categories?edit=${c.id}`} scroll={false} className="group flex items-center gap-3">
                    <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-t-full rounded-b-lg bg-sand">{c.image && <Image src={c.image} alt="" fill sizes="44px" className="object-cover" />}</span>
                    <span>
                      <span className="font-medium group-hover:underline">{c.name}</span>
                      <span className="block text-xs text-muted">/shop?category={c.id}</span>
                    </span>
                  </Link>
                </td>
                <td className="hidden text-sm md:table-cell">{c.title}</td>
                <td className="text-right">
                  {count(c.id) ? (
                    <Link href={`/admin/products?view=cat:${c.id}`} className="underline-offset-2 hover:underline">
                      {count(c.id)} · arrange
                    </Link>
                  ) : (
                    <span className="text-muted">None yet</span>
                  )}
                </td>
                <td className="text-right">
                  <form action={moveCategoryAction} className="adm-order-btns">
                    <input type="hidden" name="id" value={c.id} />
                    <button name="dir" value="-1" disabled={i === 0} aria-label={`Move ${c.name} up`}>
                      ↑
                    </button>
                    <button name="dir" value="1" disabled={i === categories.length - 1} aria-label={`Move ${c.name} down`}>
                      ↓
                    </button>
                  </form>
                </td>
              </ClickRow>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Click a category anywhere on its row to edit its name, title, description and photo.</p>

      {editing && (
        <Modal closeHref="/admin/categories" title={editing === "new" ? "Add a Category" : editing.name} sub="Changes go live when you save.">
          <CategoryForm
            key={editing === "new" ? "new" : editing.id}
            category={editing === "new" ? undefined : editing}
            productCount={editing === "new" ? 0 : count(editing.id)}
            returnTo={`/admin/categories?edit=${editing === "new" ? "new" : editing.id}`}
          />
        </Modal>
      )}
    </>
  );
}

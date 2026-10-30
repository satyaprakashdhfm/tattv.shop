import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";
import { loadCatalogData, loadCosts, type ProductScope } from "@/lib/server/catalog";
import { moveProductAction } from "../../actions";
import { PageHead } from "../ui";
import { ClickRow } from "../click-row";
import { Modal } from "../modal";
import { ProductForm } from "./product-form";
import { defaultShippingReturns } from "@/lib/product-copy";

export const metadata = { title: "Products" };

type View = { scope: ProductScope; label: string; where: string; storeHref: string; note?: string; filter: (p: Product) => boolean };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [{ products, categories, settings }, costs] = await Promise.all([loadCatalogData(), loadCosts()]);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  // Every place on the store where the order of products matters. Each one is the same shop order, filtered.
  const views: View[] = [
    { scope: "all", label: "Whole shop", where: "the Shop page (/shop), sorted by Featured", storeHref: "/shop", filter: () => true },
    { scope: "new", label: "Home · New Arrivals", where: "New Arrivals on the home page", storeHref: "/", note: "Only pieces ticked “New arrival”. The home page shows the first 8.", filter: (p) => !!p.isNew },
    { scope: "bestseller", label: "Home · Bestsellers", where: "Bestsellers on the home page", storeHref: "/", note: "Only pieces ticked “Bestseller”. The home page shows the first 4.", filter: (p) => !!p.bestseller },
    ...categories.map((c): View => ({ scope: `cat:${c.id}`, label: c.name, where: `the ${c.name} page (/shop?category=${c.id})`, storeHref: `/shop?category=${c.id}`, filter: (p) => p.category === c.id })),
  ];
  const view = views.find((v) => v.scope === sp.view) ?? views[0];
  const list = products.filter(view.filter);
  const listHref = view.scope === "all" ? "/admin/products" : `/admin/products?view=${view.scope}`;
  const withParam = (k: string, v: string) => `${listHref}${listHref.includes("?") ? "&" : "?"}${k}=${encodeURIComponent(v)}`;

  const editing = sp.edit === "new" ? "new" : products.find((p) => p.slug === sp.edit);
  const savedName = sp.saved && products.find((p) => p.slug === sp.saved)?.name;

  return (
    <>
      <PageHead title="Products" sub={`${products.filter((p) => p.active !== false).length} in the store · ${products.filter((p) => p.active === false).length} hidden`}>
        <Link href={withParam("edit", "new")} scroll={false} className="btn btn-dark btn-sm">
          + Add Product
        </Link>
      </PageHead>
      {sp.deleted && <p className="adm-ok">Product deleted.</p>}
      {savedName && <p className="adm-ok">“{savedName}” saved. Changes are live on the store.</p>}

      <div>
        <p className="adm-label mb-2">Arrange products for</p>
        <nav aria-label="Product order sections" className="adm-chips flex-wrap !rounded-[1.5rem]">
          {views.map((v) => (
            <Link key={v.scope} href={v.scope === "all" ? "/admin/products" : `/admin/products?view=${v.scope}`} scroll={false} aria-current={v === view ? "page" : undefined} className="adm-chip">
              {v.label} <span className="adm-chip-n">{products.filter(v.filter).length}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="adm-note flex flex-wrap items-center justify-between gap-3">
        <span>
          This is the order on <b className="font-medium">{view.where}</b>. The top of the list shows first; use <b className="font-medium">Top</b>, ↑ and ↓ to move a piece.
          {view.note && <span className="block text-xs text-muted">{view.note}</span>}
        </span>
        <a href={view.storeHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] underline underline-offset-4">
          See it in the store <ArrowUpRight size={12} />
        </a>
      </div>

      <div className="adm-card overflow-hidden overflow-x-auto !p-0">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted">No products here yet.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Product</th>
                <th className="text-right">Price</th>
                <th className="hidden text-right lg:table-cell">Cost · Profit</th>
                <th className="hidden text-right md:table-cell">Stock</th>
                {!view.scope.startsWith("cat:") && <th className="hidden md:table-cell">Category</th>}
                <th className="text-right">Order</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p, i) => (
                <ClickRow key={p.slug} href={withParam("edit", p.slug)}>
                  <td className="text-muted">{i + 1}</td>
                  <td>
                    <Link href={withParam("edit", p.slug)} scroll={false} className="group flex items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-sand">{p.images[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />}</span>
                      <span>
                        <span className="font-medium group-hover:underline">{p.name}</span>
                        {p.active === false && <span className="pill pill-hidden ml-2">Hidden</span>}
                        {p.badge && <span className="block text-xs text-muted">{p.badge}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="text-right">
                    {formatPrice(p.price)}
                    {p.compareAt ? <s className="block text-xs text-muted">{formatPrice(p.compareAt)}</s> : null}
                  </td>
                  <td className="hidden text-right lg:table-cell">
                    {costs.has(p.slug) ? (
                      <>
                        {formatPrice(costs.get(p.slug)!)}
                        <span className={`block text-xs ${p.price - costs.get(p.slug)! < 0 ? "text-red-700" : "text-muted"}`}>
                          {formatPrice(p.price - costs.get(p.slug)!)} · {Math.round(((p.price - costs.get(p.slug)!) / p.price) * 100)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted">No cost price</span>
                    )}
                  </td>
                  <td className="hidden text-right md:table-cell">
                    {p.stock == null ? <span className="text-muted">Not tracked</span> : p.stock === 0 ? <b className="font-medium text-red-700">Sold out</b> : p.stock}
                  </td>
                  {!view.scope.startsWith("cat:") && <td className="hidden text-sm md:table-cell">{catName(p.category)}</td>}
                  <td className="text-right">
                    <form action={moveProductAction} className="inline-flex items-center gap-2">
                      <input type="hidden" name="slug" value={p.slug} />
                      <input type="hidden" name="scope" value={view.scope} />
                      <button name="dir" value="top" disabled={i === 0} aria-label={`Move ${p.name} to the top`} className="h-8 rounded-full border border-line bg-white px-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors hover:border-ink disabled:opacity-30 disabled:hover:border-line">
                        Top
                      </button>
                      <span className="adm-order-btns">
                        <button name="dir" value="-1" disabled={i === 0} aria-label={`Move ${p.name} up`}>
                          ↑
                        </button>
                        <button name="dir" value="1" disabled={i === list.length - 1} aria-label={`Move ${p.name} down`}>
                          ↓
                        </button>
                      </span>
                    </form>
                  </td>
                </ClickRow>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-muted">Click a product anywhere on its row to edit its photos, price, sizes and description.</p>

      {editing && (
        <Modal
          closeHref={listHref}
          title={editing === "new" ? "Add a Product" : editing.name}
          sub={editing === "new" ? "It goes live when you add it (untick “Show in the store” to keep it hidden)." : "Changes go live when you save."}
        >
          <ProductForm key={editing === "new" ? "new" : editing.slug} product={editing === "new" ? undefined : editing} cost={editing === "new" ? null : costs.get(editing.slug)} categories={categories} standardShipping={defaultShippingReturns(settings)} returnTo={withParam("edit", editing === "new" ? "new" : editing.slug)} />
        </Modal>
      )}
    </>
  );
}

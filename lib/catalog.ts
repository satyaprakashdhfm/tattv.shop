// Helpers over the catalogue data ({ products, categories, settings }) that lives in the database
// and is edited in the admin. Pure functions, used on the server and in the browser.
import type { Category, CategoryId, Product } from "./products";

/** Edited in Admin → Site Settings. */
export interface StoreSettings {
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  /** Messages rotating in the top ribbon, in order. */
  announcements: string[];
  /** Contact details shown across the store. */
  email: string;
  /** One number for calls and WhatsApp. */
  phone: string;
  hours: string;
  /** Studio address, one line per row. */
  address: string;
}

export interface CatalogData {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
}

export type Catalog = ReturnType<typeof makeCatalog>;

export function makeCatalog(data: CatalogData) {
  const products = data.products.filter((p) => p.active !== false);
  const categories = data.categories;
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const getProduct = (slug: string) => bySlug.get(slug);
  const categoryName = (id: CategoryId) => categories.find((c) => c.id === id)?.name ?? id;
  const categoryTitle = (id: CategoryId) => categories.find((c) => c.id === id)?.title ?? id;

  return {
    products,
    categories,
    settings: data.settings,
    getProduct,
    categoryName,
    categoryTitle,

    /** Same category first, then the same collection. */
    related(product: Product, count = 4) {
      const sameCategory = products.filter((p) => p.slug !== product.slug && p.category === product.category);
      const others = products.filter((p) => p.category !== product.category && p.collection === product.collection);
      return [...sameCategory, ...others].slice(0, count);
    },

    /**
     * "Complete the look" for a bag: pieces from categories the bag doesn't have yet (same collection
     * first), then more from the bag's own categories, then bestsellers. Never what's already in it,
     * never sold out.
     */
    recommend(slugs: string[], count = 4) {
      const inBag = slugs.map(getProduct).filter((p): p is Product => !!p);
      const taken = new Set(slugs);
      const pool = products.filter((p) => !taken.has(p.slug) && !p.soldOut);
      const bagCategories = new Set(inBag.map((p) => p.category));
      const bagCollections = new Set(inBag.map((p) => p.collection));
      const score = (p: Product) =>
        (bagCategories.has(p.category) ? 0 : 4) + (bagCollections.has(p.collection) ? 2 : 0) + (p.bestseller ? 1 : 0);
      return [...pool].sort((a, b) => score(b) - score(a)).slice(0, count);
    },

    search(query: string) {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return products.filter((p) => [p.name, p.short, categoryName(p.category), p.collection, p.material].join(" ").toLowerCase().includes(q));
    },
  };
}

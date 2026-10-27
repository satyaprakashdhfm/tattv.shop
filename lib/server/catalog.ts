import "server-only";
import crypto from "node:crypto";
import sharp from "sharp";
import type { PoolClient } from "pg";
import { makeCatalog, type CatalogData, type StoreSettings } from "@/lib/catalog";
import type { Category, Finish, Product } from "@/lib/products";
import { OrderError } from "@/lib/pricing";
import { DEFAULT_SETTINGS } from "@/lib/site";
import { DEFAULT_SHIPPING_RETURNS, customLines, defaultCare } from "@/lib/product-copy";
import { query, transaction } from "./db";

// Catalogue storage: categories, products (+ product_images) and the store settings row.
// Reads are cached in memory for a short while; every admin edit drops the cache.

let cache: { at: number; data: CatalogData } | null = null;
const TTL = 30_000;

export const invalidateCatalog = () => {
  cache = null;
};

interface ProductRow {
  slug: string;
  name: string;
  category_id: string;
  collection: Product["collection"];
  price: number;
  compare_at: number | null;
  material: string;
  finish: Finish;
  size_label: string | null;
  size_values: string[] | null;
  badge: Product["badge"] | null;
  is_new: boolean;
  bestseller: boolean;
  short: string;
  description: string;
  details: string[];
  care: string[] | null;
  shipping_returns: string[] | null;
  stock: number | null;
  active: boolean;
  images: string[] | null;
}

const toProduct = (r: ProductRow): Product => ({
  slug: r.slug,
  name: r.name,
  category: r.category_id,
  collection: r.collection,
  price: r.price,
  compareAt: r.compare_at ?? undefined,
  material: r.material,
  finish: r.finish,
  images: r.images ?? [],
  sizes: r.size_label && r.size_values?.length ? { label: r.size_label, values: r.size_values } : undefined,
  badge: r.badge ?? undefined,
  isNew: r.is_new,
  bestseller: r.bestseller,
  stock: r.stock,
  soldOut: r.stock === 0,
  active: r.active,
  short: r.short,
  description: r.description,
  details: r.details,
  ...(r.care?.length ? { care: r.care } : {}),
  ...(r.shipping_returns?.length ? { shippingReturns: r.shipping_returns } : {}),
});

/** Everything, including hidden products (for the admin and order pricing). */
export async function loadCatalogData(): Promise<CatalogData> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const [products, categories, settings] = await Promise.all([
    query<ProductRow>(`
      SELECT p.*, COALESCE((SELECT array_agg(url ORDER BY position) FROM product_images i WHERE i.product_slug = p.slug), '{}') AS images
      FROM products p ORDER BY p.sort_order, p.created_at`),
    query<Category>("SELECT id, name, title, blurb, image FROM categories ORDER BY sort_order, created_at"),
    query<{ value: Partial<StoreSettings> & { announcement?: string; whatsapp?: string } }>("SELECT value FROM settings WHERE key = 'store'"),
  ]);
  const data: CatalogData = {
    products: products.rows.map(toProduct),
    categories: categories.rows,
    settings: withDefaults(settings.rows[0]?.value),
  };
  cache = { at: Date.now(), data };
  return data;
}

/** What the storefront sees: active products only, plus helpers. */
export async function getCatalog() {
  return makeCatalog(await loadCatalogData());
}

/** The slice sent to the browser: active products only. */
export async function getClientCatalog(): Promise<CatalogData> {
  const d = await loadCatalogData();
  return { ...d, products: d.products.filter((p) => p.active !== false) };
}

// ── Images ──
// Uploads are resized to at most 1600px and stored as WebP. They are never deleted
// automatically, so past orders keep showing the photo they were sold with.
export async function saveImage(file: File | null): Promise<string | null> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  if (file.size > 20 * 1024 * 1024) throw new OrderError(`${file.name} is larger than 20 MB.`);
  let out: Buffer;
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new OrderError(`${file.name} is not an image we can read. Please use JPG, PNG or WebP.`);
  }
  const id = crypto.randomBytes(9).toString("base64url");
  await query("INSERT INTO media (id, mime, data) VALUES ($1, 'image/webp', $2)", [id, out]);
  return `/media/${id}.webp`;
}

export async function getMedia(id: string) {
  const r = await query<{ mime: string; data: Buffer }>("SELECT mime, data FROM media WHERE id = $1", [id]);
  return r.rows[0] ?? null;
}

// ── Products ──
export function slugify(s: string) {
  return (
    String(s)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}

const rupees = (v: unknown, label: string, optional = false): number | null => {
  if (optional && (v === "" || v == null)) return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n <= 0) throw new OrderError(`${label} must be a whole number of rupees above 0.`);
  return n;
};

const stockOf = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 0) throw new OrderError("Stock must be a whole number (or empty).");
  return n;
};

const FINISHES: Finish[] = ["silver", "gold", "black", "two-tone", "leather"];
const BADGES = ["New", "Bestseller", "Limited Edition"];

export interface ProductInput {
  slug?: string;
  name: string;
  category: string;
  collection: string;
  price: unknown;
  compareAt: unknown;
  stock: unknown;
  material: string;
  finish: string;
  sizeLabel: string;
  sizeValues: string;
  badge: string;
  isNew: boolean;
  bestseller: boolean;
  short: string;
  description: string;
  details: string;
  care: string;
  shippingReturns: string;
  active: boolean;
  images: string[];
}

async function uniqueSlug(db: PoolClient, table: "products" | "categories", base: string) {
  const col = table === "products" ? "slug" : "id";
  let slug = base;
  for (let i = 2; (await db.query(`SELECT 1 FROM ${table} WHERE ${col} = $1`, [slug])).rowCount; i++) slug = `${base}-${i}`;
  return slug;
}

export async function saveProduct(input: ProductInput, { isNew }: { isNew: boolean }) {
  const name = String(input.name || "").trim().slice(0, 120);
  if (!name) throw new OrderError("Give the product a name.");
  const price = rupees(input.price, "Price")!;
  const compareAt = rupees(input.compareAt, "Original price", true);
  const stock = stockOf(input.stock);
  if (!input.images.length) throw new OrderError("Add at least one photo.");
  const sizeValues = String(input.sizeValues || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30);
  const sizeLabel = String(input.sizeLabel || "").trim().slice(0, 40);
  if (sizeValues.length && !sizeLabel) throw new OrderError('Name the size option, e.g. "Ring Size" or "Length".');

  const slug = await transaction(async (db) => {
    const cat = await db.query("SELECT 1 FROM categories WHERE id = $1", [input.category]);
    if (!cat.rowCount) throw new OrderError("Choose a category.");
    let slug = input.slug || "";
    if (isNew) {
      slug = await uniqueSlug(db, "products", slugify(name));
    } else if (!(await db.query("SELECT 1 FROM products WHERE slug = $1 FOR UPDATE", [slug])).rowCount) {
      throw new OrderError("Product not found", 404);
    }
    const values = [
      slug, name, input.category, input.collection === "modern" ? "modern" : "classic", price,
      compareAt && compareAt > price ? compareAt : null,
      String(input.material || "").trim().slice(0, 120),
      FINISHES.includes(input.finish as Finish) ? input.finish : "silver",
      sizeValues.length ? sizeLabel : null, sizeValues.length ? sizeValues : null,
      BADGES.includes(input.badge) ? input.badge : null, !!input.isNew, !!input.bestseller,
      String(input.short || "").trim().slice(0, 300), String(input.description || "").trim().slice(0, 5000),
      String(input.details || "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20),
      stock, !!input.active,
      customLines(input.care, defaultCare(String(input.finish))), customLines(input.shippingReturns, DEFAULT_SHIPPING_RETURNS),
    ];
    if (isNew) {
      await db.query(
        `INSERT INTO products (slug, name, category_id, collection, price, compare_at, material, finish, size_label, size_values,
           badge, is_new, bestseller, short, description, details, stock, active, care, shipping_returns, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM products))`,
        values,
      );
    } else {
      await db.query(
        `UPDATE products SET name=$2, category_id=$3, collection=$4, price=$5, compare_at=$6, material=$7, finish=$8, size_label=$9,
           size_values=$10, badge=$11, is_new=$12, bestseller=$13, short=$14, description=$15, details=$16, stock=$17, active=$18,
           care=$19, shipping_returns=$20, updated_at=now() WHERE slug=$1`,
        values,
      );
    }
    await db.query("DELETE FROM product_images WHERE product_slug = $1", [slug]);
    for (const [pos, url] of input.images.entries()) {
      await db.query("INSERT INTO product_images (product_slug, position, url) VALUES ($1, $2, $3)", [slug, pos, url]);
    }
    return slug;
  });
  invalidateCatalog();
  return slug;
}

export async function deleteProduct(slug: string) {
  await query("DELETE FROM products WHERE slug = $1", [slug]);
  invalidateCatalog();
}

export async function quickUpdateProducts(rows: { slug: string; price: unknown; stock: unknown; active: boolean }[]) {
  await transaction(async (db) => {
    for (const r of rows) {
      const price = rupees(r.price, `Price for ${r.slug}`)!;
      await db.query(
        `UPDATE products SET price = $2, stock = $3, active = $4, updated_at = now(),
           compare_at = CASE WHEN compare_at > $2 THEN compare_at ELSE NULL END
         WHERE slug = $1`,
        [r.slug, price, stockOf(r.stock), r.active],
      );
    }
  });
  invalidateCatalog();
}

/** Swaps a row with its neighbour in `table`'s sort order. */
/** Rewrites sort_order so the rows appear in `keys` order. */
async function writeOrder(db: PoolClient, table: "products" | "categories", keys: string[]) {
  const col = table === "products" ? "slug" : "id";
  await db.query(`UPDATE ${table} t SET sort_order = x.n - 1 FROM unnest($1::text[]) WITH ORDINALITY AS x(k, n) WHERE t.${col} = x.k`, [keys]);
}

async function move(table: "products" | "categories", key: string, dir: number) {
  const col = table === "products" ? "slug" : "id";
  await transaction(async (db) => {
    const list = (await db.query<{ k: string }>(`SELECT ${col} AS k FROM ${table} ORDER BY sort_order, created_at FOR UPDATE`)).rows.map((r) => r.k);
    const i = list.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await writeOrder(db, table, list);
  });
  invalidateCatalog();
}

/**
 * Where a product order is seen: the whole shop ("all"), the home page's New Arrivals ("new") or
 * Bestsellers ("bestseller"), or one category page ("cat:<id>"). Every list is the one shop order
 * filtered, so moving a piece within a section only swaps it with its neighbour in that section.
 */
export type ProductScope = "all" | "new" | "bestseller" | `cat:${string}`;

export async function moveProduct(slug: string, dir: number | "top", scope: ProductScope = "all") {
  await transaction(async (db) => {
    const rows = (
      await db.query<{ k: string; is_new: boolean; bestseller: boolean; category_id: string }>(
        "SELECT slug AS k, is_new, bestseller, category_id FROM products ORDER BY sort_order, created_at FOR UPDATE",
      )
    ).rows;
    const inScope = (r: (typeof rows)[number]) =>
      scope === "new" ? r.is_new : scope === "bestseller" ? r.bestseller : scope.startsWith("cat:") ? r.category_id === scope.slice(4) : true;
    const list = rows.map((r) => r.k);
    const section = rows.filter(inScope).map((r) => r.k);
    const i = section.indexOf(slug);
    if (i <= 0 && dir !== 1) return;
    if (dir === "top") {
      list.splice(list.indexOf(slug), 1);
      list.splice(list.indexOf(section[0]), 0, slug);
    } else {
      const j = i + dir;
      if (i < 0 || j < 0 || j >= section.length) return;
      const a = list.indexOf(slug);
      const b = list.indexOf(section[j]);
      [list[a], list[b]] = [list[b], list[a]];
    }
    await writeOrder(db, "products", list);
  });
  invalidateCatalog();
}

export const moveCategory = (id: string, dir: number) => move("categories", id, dir);

// ── Categories ──
export async function saveCategory(input: { id?: string; name: string; title: string; blurb: string; image: string }, { isNew }: { isNew: boolean }) {
  const name = String(input.name || "").trim().slice(0, 60);
  if (!name) throw new OrderError("Give the category a name.");
  const title = String(input.title || "").trim().slice(0, 80) || name;
  const blurb = String(input.blurb || "").trim().slice(0, 300);
  await transaction(async (db) => {
    if (isNew) {
      const id = await uniqueSlug(db, "categories", slugify(name));
      await db.query(
        "INSERT INTO categories (id, name, title, blurb, image, sort_order) VALUES ($1,$2,$3,$4,$5,(SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories))",
        [id, name, title, blurb, input.image || ""],
      );
    } else {
      const r = await db.query("UPDATE categories SET name=$2, title=$3, blurb=$4, image=$5 WHERE id=$1", [input.id, name, title, blurb, input.image || ""]);
      if (!r.rowCount) throw new OrderError("Category not found", 404);
    }
  });
  invalidateCatalog();
}

export async function deleteCategory(id: string) {
  const used = await query("SELECT count(*)::int AS n FROM products WHERE category_id = $1", [id]);
  const n = used.rows[0].n as number;
  if (n > 0) throw new OrderError(`Move or delete the ${n} product${n === 1 ? "" : "s"} in this category first.`);
  await query("DELETE FROM categories WHERE id = $1", [id]);
  invalidateCatalog();
}

// ── Settings ──
const url = (v: unknown) => {
  const s = String(v || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : "https://" + s.replace(/^\/+/, "");
};

/**
 * Stored settings over the defaults. Rows saved before the ribbon became a list hold a single
 * optional `announcement`; it goes first, ahead of the standard messages, as it did then.
 */
function withDefaults(stored: (Partial<StoreSettings> & { announcement?: string; whatsapp?: string }) | undefined): StoreSettings {
  // `whatsapp` was a second number before calls and WhatsApp shared one; it is no longer used.
  const { announcement, whatsapp, ...rest } = stored ?? {};
  const announcements = rest.announcements ?? (announcement ? [announcement, ...DEFAULT_SETTINGS.announcements] : DEFAULT_SETTINGS.announcements);
  return { ...DEFAULT_SETTINGS, ...rest, announcements };
}

export async function saveSettings(input: Partial<Record<keyof StoreSettings, unknown>>) {
  const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
  const email = text(input.email).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  const digits = text(input.phone).replace(/\D/g, "");
  if (digits && (digits.length < 10 || digits.length > 13)) throw new Error("Enter a valid phone number.");
  const value: StoreSettings = {
    instagram: url(input.instagram),
    facebook: url(input.facebook),
    twitter: url(input.twitter),
    youtube: url(input.youtube),
    announcements: (Array.isArray(input.announcements) ? input.announcements : []).map((m) => text(m)).filter(Boolean).slice(0, 10),
    email: email || DEFAULT_SETTINGS.email,
    phone: text(input.phone, 30),
    hours: text(input.hours, 120),
    address: text(input.address, 400).replace(/\r/g, ""),
  };
  await query(
    "INSERT INTO settings (key, value) VALUES ('store', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()",
    [JSON.stringify(value)],
  );
  invalidateCatalog();
}

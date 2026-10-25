import { PREVIEW_PRODUCTS, SHOW_PREVIEW_PRODUCTS } from "./preview-products";

export type CategoryId = "chains" | "rings" | "bracelets" | "wallets";
export type CollectionId = "modern" | "classic";
export type Finish = "silver" | "gold" | "black" | "two-tone" | "leather";

export interface Product {
  slug: string;
  name: string;
  category: CategoryId;
  collection: CollectionId;
  price: number;
  compareAt?: number;
  material: string;
  finish: Finish;
  /** Paths under /public, from TATTV's Instagram posts until original product shots are supplied. */
  images: string[];
  sizes?: { label: string; values: string[] };
  badge?: "New" | "Bestseller" | "Limited Edition";
  isNew?: boolean;
  bestseller?: boolean;
  /** Out of stock: still listed, but can't be added to the bag. */
  soldOut?: boolean;
  short: string;
  description: string;
  details: string[];
}

export const CATEGORIES: { id: CategoryId; name: string; blurb: string; image: string }[] = [
  { id: "chains", name: "Chains", blurb: "Chains and pendants, layered or worn alone.", image: "/images/categories/chains.jpg" },
  { id: "rings", name: "Rings", blurb: "Bands and sculpted forms made for everyday wear.", image: "/images/categories/rings.jpg" },
  { id: "bracelets", name: "Bracelets", blurb: "Cuffs, bangles and leather with a quiet, confident weight.", image: "/images/categories/bracelets.jpg" },
  { id: "wallets", name: "Wallets", blurb: "Genuine leather, clean lines, built to age well.", image: "/images/categories/wallets.jpg" },
];

export const COLLECTIONS: { id: CollectionId; name: string; tagline: string; blurb: string }[] = [
  {
    id: "modern",
    name: "Modern",
    tagline: "Clean lines. Bold intent.",
    blurb: "Architectural forms, black finishes and minimal silhouettes for the man who edits.",
  },
  {
    id: "classic",
    name: "Classic",
    tagline: "Heritage, refined.",
    blurb: "Time-honoured tags, bangles and leather that never ask for attention, and always get it.",
  },
];

export const MATERIALS: { id: Finish; name: string }[] = [
  { id: "silver", name: "Silver Tone" },
  { id: "gold", name: "Gold Tone" },
  { id: "black", name: "Black" },
  { id: "two-tone", name: "Two-Tone" },
  { id: "leather", name: "Leather" },
];

const CHAIN_LENGTHS = { label: "Length", values: ['18"', '20"', '22"', '24"'] };
const RING_SIZES = { label: "Ring Size", values: ["8", "10", "12", "14", "16", "18", "20", "22", "24"] };
const WRIST_SIZES = { label: "Wrist Size", values: ['S · 7"', 'M · 7.5"', 'L · 8"', 'XL · 8.5"'] };

const img = (...names: string[]) => names.map((n) => `/images/products/${n}.jpg`);

export const PRODUCTS: Product[] = [
  // ——— Chains ———
  {
    slug: "star-dog-tag-pendant",
    name: "Star Dog Tag Pendant",
    category: "chains",
    collection: "classic",
    price: 1499,
    material: "Stainless Steel",
    finish: "silver",
    images: img("star-dog-tag-pendant"),
    sizes: CHAIN_LENGTHS,
    badge: "Bestseller",
    bestseller: true,
    short: "A polished steel tag with a raised star emblem.",
    description: "Our take on the military classic: a bevelled steel tag with a star medallion at its centre, hung on a fine box chain.",
    details: ["Tag: 22 × 36mm", "2mm box chain with lobster clasp", "Stainless steel, won't tarnish", "Hypoallergenic"],
  },
  {
    slug: "lightning-tag-pendant",
    name: "Lightning Tag Pendant",
    category: "chains",
    collection: "modern",
    price: 1499,
    material: "Stainless Steel with Gold Accent",
    finish: "two-tone",
    images: img("lightning-tag-pendant"),
    sizes: CHAIN_LENGTHS,
    isNew: true,
    badge: "New",
    short: "A brushed steel tag with an inlaid gold lightning bolt.",
    description: "A clean rectangular tag in brushed steel, set with a gold-tone lightning bolt and hung on a sturdy box chain.",
    details: ["Tag: 18 × 30mm", "3mm box chain", "Stainless steel with gold-tone inlay", "Water resistant"],
  },

  // ——— Rings ———
  {
    slug: "curb-link-ring",
    name: "Curb Link Ring",
    category: "rings",
    collection: "modern",
    price: 999,
    material: "Oxidised Stainless Steel",
    finish: "silver",
    images: img("curb-link-ring"),
    sizes: RING_SIZES,
    isNew: true,
    badge: "New",
    short: "A band carved with an oxidised curb-chain pattern.",
    description: "The look of a curb chain, sculpted into a solid band. Oxidised recesses make every link stand out.",
    details: ["7mm width", "Oxidised stainless steel", "Comfort-fit interior", "Water resistant"],
  },

  // ——— Bracelets ———
  {
    slug: "mesh-inlay-bangle",
    name: "Mesh Inlay Bangle",
    category: "bracelets",
    collection: "modern",
    price: 1299,
    material: "Stainless Steel",
    finish: "black",
    images: img("mesh-inlay-bangle", "mesh-inlay-bangle-2"),
    sizes: WRIST_SIZES,
    badge: "Bestseller",
    bestseller: true,
    short: "A hinged steel bangle with a black textured-mesh inlay.",
    description: "Polished steel edges frame a band of fine black mesh. The hinged opening makes it easy to put on and take off.",
    details: ["8mm width", "Stainless steel with black mesh inlay", "Hinged clasp", "Water resistant"],
  },
  {
    slug: "twin-cable-bangle",
    name: "Twin Cable Bangle",
    category: "bracelets",
    collection: "classic",
    price: 1499,
    material: "Stainless Steel",
    finish: "silver",
    images: img("twin-cable-bangle"),
    sizes: WRIST_SIZES,
    bestseller: true,
    short: "A polished bangle with two twisted steel cables.",
    description: "Two twisted cables run between polished steel rails, held by sliding bar stations. Classic and quietly substantial.",
    details: ["9mm width", "Stainless steel", "Hinged clasp", "Water resistant"],
  },

  // ——— Wallets ———
  {
    slug: "leather-card-wallet",
    name: "Leather Card Wallet",
    category: "wallets",
    collection: "classic",
    price: 1299,
    material: "Genuine Leather",
    finish: "leather",
    images: img("leather-card-wallet", "leather-card-wallet-2"),
    bestseller: true,
    short: "A slim bifold card wallet with contrast stitching.",
    description: "Smooth genuine leather in a slim bifold, with four card slots, a centre pocket and a snap-button note sleeve.",
    details: ["4 card slots + centre pocket", "Snap-button note sleeve", "Genuine leather, contrast stitching", "10.5 × 7.5cm closed"],
  },
  // Sample pieces appended after the real catalogue (see lib/preview-products.ts).
  ...(SHOW_PREVIEW_PRODUCTS ? PREVIEW_PRODUCTS : []),
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const categoryName = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

export const relatedProducts = (product: Product, count = 4) => {
  const sameCategory = PRODUCTS.filter((p) => p.slug !== product.slug && p.category === product.category);
  const others = PRODUCTS.filter((p) => p.category !== product.category && p.collection === product.collection);
  return [...sameCategory, ...others].slice(0, count);
};

export function searchProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter((p) =>
    [p.name, p.short, categoryName(p.category), p.collection, p.material].join(" ").toLowerCase().includes(q),
  );
}

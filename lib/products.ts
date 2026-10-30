// Product and category types, plus the starting catalogue. The live catalogue is in the database
// (seeded from SEED_PRODUCTS / SEED_CATEGORIES on first run) and is edited in the admin portal.
import { PREVIEW_PRODUCTS, SHOW_PREVIEW_PRODUCTS } from "./preview-products";

/** Category ids are slugs ("chains", "rings"…); new ones can be added in the admin. */
export type CategoryId = string;
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
  /** A short video of the piece (uploaded in the admin), shown in the gallery after the main photo. */
  video?: string;
  sizes?: { label: string; values: string[] };
  badge?: "New" | "Bestseller" | "Limited Edition";
  isNew?: boolean;
  bestseller?: boolean;
  /** Units left; null when stock isn't tracked (always available). */
  stock?: number | null;
  /** Out of stock (stock is 0): still listed, but can't be added to the bag. */
  soldOut?: boolean;
  /** False when hidden from the store in the admin. */
  active?: boolean;
  short: string;
  description: string;
  details: string[];
  /** Care and Shipping & Returns points for this piece; when absent the standard text applies (lib/product-copy.ts). */
  care?: string[];
  shippingReturns?: string[];
}

/** `name` is the plain label (menus, filters, breadcrumbs); `title` is the editorial name shown on tiles and page headers. */
export interface Category {
  id: CategoryId;
  name: string;
  title: string;
  blurb: string;
  /** Tall photo in the arch ("window") on the home page's Shop by Category. */
  image: string;
  /** Wide photo across the top of the category's shop page ("" = the store's general banner). */
  banner?: string;
  /** How light the banner is behind the title: light photos get dark text, dark ones white text. */
  bannerTone?: "light" | "dark";
  /** Which side of the banner the title sits on (the photo's empty side). */
  bannerAlign?: "left" | "right";
  /** CSS object-position for the banner, so the subject stays in view. */
  bannerPosition?: string;
}

export const SEED_CATEGORIES: Category[] = [
  { id: "earrings", name: "Earrings", title: "On the Ear", blurb: "Studs, hoops and huggies, small details that sharpen the whole look.", image: "/images/categories/arch/earrings.jpg" },
  { id: "chains", name: "Chains", title: "Chain Reaction", blurb: "Chains and pendants, layered or worn alone.", image: "/images/categories/arch/chains.jpg" },
  { id: "bracelets", name: "Bracelets", title: "Around the Wrist", blurb: "Cuffs, bangles and leather with a quiet, confident weight.", image: "/images/categories/arch/bracelets.jpg" },
  { id: "rings", name: "Rings", title: "Ring Theory", blurb: "Bands and sculpted forms made for everyday wear.", image: "/images/categories/arch/rings.jpg" },
  { id: "wallets", name: "Daily Objects", title: "Daily Objects", blurb: "Wallets, bags and everyday carry in genuine leather, built to age well.", image: "/images/categories/arch/wallets.jpg" },
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

export const SEED_PRODUCTS: Product[] = [
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

  // ——— Office bags (Daily Objects) ———
  // Photos: Unsplash (free licence), stand-ins until TATTV's own bag photography.
  {
    slug: "tan-leather-office-messenger",
    name: "Tan Leather Office Messenger",
    category: "wallets",
    collection: "classic",
    price: 4999,
    material: "Genuine Leather",
    finish: "leather",
    images: img("tan-leather-office-messenger"),
    isNew: true,
    badge: "New",
    short: "A structured tan messenger for the workday, carried by hand or on the shoulder.",
    description: "Smooth tan leather with a deep envelope flap, a top grab handle and a detachable shoulder strap. Room for a laptop, a notebook and the day's papers.",
    details: ["Fits up to a 14\" laptop", "Top handle + detachable shoulder strap", "Envelope flap with magnetic closure", "Genuine leather"],
  },
  {
    slug: "classic-leather-satchel",
    name: "Classic Leather Satchel",
    category: "wallets",
    collection: "classic",
    price: 3999,
    material: "Genuine Leather",
    finish: "leather",
    images: img("classic-leather-satchel"),
    isNew: true,
    badge: "New",
    short: "A chestnut satchel with twin buckle straps, worn across the body.",
    description: "Chestnut leather with a full front flap, twin buckle straps and a long adjustable strap to wear on the shoulder or across the body.",
    details: ["Fits up to a 13\" laptop", "Twin buckle straps, push-lock closure", "Adjustable cross-body strap", "Genuine leather"],
  },
  {
    slug: "black-leather-laptop-bag",
    name: "Black Leather Laptop Bag",
    category: "wallets",
    collection: "modern",
    price: 5499,
    material: "Genuine Leather",
    finish: "black",
    images: img("black-leather-laptop-bag"),
    isNew: true,
    badge: "New",
    short: "A slim black zip-top laptop bag for the office.",
    description: "Black leather in a slim zip-top shape with twin carry handles and a shoulder strap. Clean enough for a suit, sturdy enough for every day.",
    details: ["Fits up to a 15\" laptop", "Zip top, twin handles + shoulder strap", "Padded laptop sleeve", "Genuine leather"],
  },
  {
    slug: "vintage-buckle-messenger",
    name: "Vintage Buckle Messenger",
    category: "wallets",
    collection: "classic",
    price: 4499,
    material: "Genuine Leather",
    finish: "leather",
    images: img("vintage-buckle-messenger"),
    short: "Rich tan leather with buckle straps and a front pocket, made to age.",
    description: "Thick, oiled tan leather with a full flap, twin buckle straps and a front pocket. It darkens and softens with every year of use.",
    details: ["Fits up to a 14\" laptop", "Twin buckles + front pocket", "Top handle + adjustable shoulder strap", "Oiled genuine leather"],
  },
  // Sample pieces appended after the real catalogue (see lib/preview-products.ts).
  ...(SHOW_PREVIEW_PRODUCTS ? PREVIEW_PRODUCTS : []),
];

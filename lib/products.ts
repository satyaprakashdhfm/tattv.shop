export type CategoryId = "chains" | "rings" | "bracelets" | "wallets";
export type CollectionId = "modern" | "classic";

export type MetalTone = "silver" | "gold" | "black" | "steel";
export type LeatherTone = "leather-black" | "leather-tan" | "leather-brown" | "leather-navy";
export type Tone = MetalTone | LeatherTone;

export type ChainStyle = "cable" | "curb" | "rope" | "box" | "ball";
export type PendantShape = "tag" | "disc" | "triangle" | "square" | "drop" | "hexagon" | "arrow" | "bar" | "monogram";
export type RingStyle = "band" | "ridged" | "signet" | "onyx" | "link" | "monogram";
export type BraceletStyle = "curb" | "box" | "beads" | "cuff" | "leather";
export type BeadStone = "onyx" | "tiger" | "lava";
export type WalletStyle = "bifold" | "cardholder" | "zip";

export type Art =
  | { kind: "chain"; style: ChainStyle; pendant?: PendantShape }
  | { kind: "ring"; style: RingStyle }
  | { kind: "bracelet"; style: BraceletStyle; bead?: BeadStone }
  | { kind: "wallet"; style: WalletStyle };

export interface ProductOption {
  id: string;
  label: string;
  tone: Tone;
  priceDelta?: number;
}

export interface Product {
  slug: string;
  name: string;
  category: CategoryId;
  collection: CollectionId;
  price: number;
  compareAt?: number;
  options: ProductOption[];
  sizes?: { label: string; values: string[] };
  art: Art;
  badge?: "New" | "Bestseller" | "Limited Edition" | "Online Exclusive";
  isNew?: boolean;
  bestseller?: boolean;
  rating: number;
  reviews: number;
  short: string;
  description: string;
  details: string[];
}

export const CATEGORIES: { id: CategoryId; name: string; blurb: string }[] = [
  { id: "chains", name: "Chains & Pendants", blurb: "Statement links and meaningful pendants, layered or worn alone." },
  { id: "rings", name: "Rings", blurb: "Signets, bands and sculpted forms made for everyday wear." },
  { id: "bracelets", name: "Bracelets", blurb: "Links, cuffs and stone beads with a quiet, confident weight." },
  { id: "wallets", name: "Wallets", blurb: "Full-grain leather, hand-finished edges, built to age well." },
];

export const COLLECTIONS: { id: CollectionId; name: string; tagline: string; blurb: string }[] = [
  {
    id: "modern",
    name: "Modern",
    tagline: "Clean lines. Bold intent.",
    blurb: "Architectural forms, oxidised finishes and minimal silhouettes for the man who edits.",
  },
  {
    id: "classic",
    name: "Classic",
    tagline: "Heritage, refined.",
    blurb: "Time-honoured links, signets and craftsmanship that never asks for attention, and always gets it.",
  },
];

export const TONES: Record<Tone, { label: string; swatch: string }> = {
  silver: { label: "Sterling Silver", swatch: "linear-gradient(135deg,#fafafa,#bdbdbd 50%,#8d8d8d)" },
  gold: { label: "Gold Vermeil", swatch: "linear-gradient(135deg,#fbe7b0,#d4a952 50%,#9b722b)" },
  black: { label: "Black Rhodium", swatch: "linear-gradient(135deg,#6b6b6b,#242424 50%,#050505)" },
  steel: { label: "Stainless Steel", swatch: "linear-gradient(135deg,#f1f4f6,#aab2b8 50%,#6f777e)" },
  "leather-black": { label: "Black", swatch: "#1c1b1a" },
  "leather-tan": { label: "Tan", swatch: "#a8693a" },
  "leather-brown": { label: "Brown", swatch: "#5a3824" },
  "leather-navy": { label: "Navy", swatch: "#1f2a44" },
};

const SILVER: ProductOption = { id: "silver", label: "925 Sterling Silver", tone: "silver" };
const GOLD: ProductOption = { id: "gold", label: "18K Gold Vermeil", tone: "gold", priceDelta: 2500 };
const BLACK: ProductOption = { id: "black", label: "Black Rhodium", tone: "black", priceDelta: 500 };
const STEEL: ProductOption = { id: "steel", label: "Stainless Steel", tone: "steel" };
const STEEL_GOLD: ProductOption = { id: "gold", label: "Gold-Plated Steel", tone: "gold", priceDelta: 600 };
const STEEL_BLACK: ProductOption = { id: "black", label: "Black IP Steel", tone: "black", priceDelta: 300 };

const leather = (...tones: LeatherTone[]): ProductOption[] =>
  tones.map((tone) => ({ id: tone.replace("leather-", ""), label: TONES[tone].label, tone }));

const CHAIN_LENGTHS = { label: "Length", values: ['18"', '20"', '22"', '24"'] };
const RING_SIZES = { label: "Ring Size", values: ["8", "10", "12", "14", "16", "18", "20", "22", "24"] };
const WRIST_SIZES = { label: "Wrist Size", values: ['S · 7"', 'M · 7.5"', 'L · 8"', 'XL · 8.5"'] };

const geometricPendant = (
  shape: PendantShape,
  name: string,
  price: number,
  copy: string,
  extra: Partial<Product> = {},
): Product => ({
  slug: `${shape === "drop" ? "teardrop" : shape}-pendant`,
  name,
  category: "chains",
  collection: "modern",
  price,
  options: [SILVER, GOLD, BLACK],
  sizes: CHAIN_LENGTHS,
  art: { kind: "chain", style: "cable", pendant: shape },
  rating: 4.8,
  reviews: 64,
  short: copy,
  description: `${copy} Hand-finished in 925 sterling silver and hung on a 2mm cable chain, it is designed to be worn close and layered freely.`,
  details: [
    "Pendant: 28mm, solid 925 sterling silver",
    "Chain: 2mm cable chain with lobster clasp",
    "Engravable reverse",
    "BIS hallmarked, nickel free",
  ],
  ...extra,
});

export const PRODUCTS: Product[] = [
  // ——— Chains & Pendants ———
  geometricPendant("triangle", "Triangle Pendant", 4990, "A sharp, polished triangle with an inset border: bold geometry, quietly worn.", {
    badge: "Bestseller",
    bestseller: true,
    rating: 4.9,
    reviews: 212,
  }),
  geometricPendant("square", "Square Pendant", 4990, "A solid square plate with a recessed frame, strong and understated.", {
    bestseller: true,
    reviews: 148,
  }),
  geometricPendant("drop", "Teardrop Pendant", 4790, "A smooth teardrop with a softly bevelled inner line.", { isNew: true, badge: "New" }),
  geometricPendant("hexagon", "Hexagon Pendant", 5290, "An architectural hexagon with a fine inner ring.", { isNew: true, badge: "New" }),
  geometricPendant("disc", "Circle Disc Pendant", 5490, "A polished disc with a concentric inner ring and a single centre point.", {
    badge: "Limited Edition",
    rating: 5,
    reviews: 41,
  }),
  {
    slug: "signature-dog-tag-pendant",
    name: "Signature Dog Tag Pendant",
    category: "chains",
    collection: "modern",
    price: 5990,
    options: [SILVER, BLACK, GOLD],
    sizes: CHAIN_LENGTHS,
    art: { kind: "chain", style: "ball", pendant: "tag" },
    badge: "Online Exclusive",
    bestseller: true,
    rating: 4.8,
    reviews: 176,
    short: "A brushed silver tag on a ball chain, ready for your initials.",
    description:
      "Our take on the military classic, with softened corners, a brushed face and a polished bevelled edge. Add up to three initials or a date at no extra charge.",
    details: ["Tag: 22 × 36mm, 925 sterling silver", "2.4mm ball chain", "Complimentary engraving", "BIS hallmarked"],
  },
  {
    slug: "monogram-t-pendant",
    name: "Monogram T Pendant",
    category: "chains",
    collection: "modern",
    price: 6490,
    options: [BLACK, SILVER, GOLD],
    sizes: CHAIN_LENGTHS,
    art: { kind: "chain", style: "box", pendant: "monogram" },
    isNew: true,
    badge: "New",
    rating: 4.9,
    reviews: 38,
    short: "The TATTV monogram, cast in solid silver and set on a box chain.",
    description:
      "Taken directly from our emblem, the interlocking T sits inside an open frame. Cast in solid silver and finished by hand.",
    details: ["Pendant: 20 × 24mm", "1.6mm box chain", "Solid 925 sterling silver", "Signature TATTV clasp"],
  },
  {
    slug: "arrow-pendant",
    name: "Arrow Pendant",
    category: "chains",
    collection: "modern",
    price: 3990,
    options: [STEEL, STEEL_BLACK, STEEL_GOLD],
    sizes: CHAIN_LENGTHS,
    art: { kind: "chain", style: "cable", pendant: "arrow" },
    rating: 4.6,
    reviews: 92,
    short: "A slim, directional arrow in surgical-grade stainless steel.",
    description: "Minimal and purposeful. A slender arrow pendant in 316L stainless steel that won't tarnish, fade or flinch.",
    details: ["Pendant: 40mm", "316L stainless steel, waterproof", "2mm cable chain", "Hypoallergenic"],
  },
  {
    slug: "cuban-link-chain",
    name: "Cuban Link Chain",
    category: "chains",
    collection: "classic",
    price: 11990,
    compareAt: 13990,
    options: [SILVER, GOLD],
    sizes: CHAIN_LENGTHS,
    art: { kind: "chain", style: "curb" },
    badge: "Bestseller",
    bestseller: true,
    rating: 4.9,
    reviews: 301,
    short: "A substantial 6mm Cuban curb, diamond-cut for light.",
    description:
      "The cornerstone of a man's jewellery box. Tightly interlocked, diamond-cut links lie flat against the collarbone and catch the light with every move.",
    details: ["6mm width, 925 sterling silver", "Diamond-cut curb links", "Box clasp with safety latch", "Approx. 38g at 22\""],
  },
  {
    slug: "rope-chain",
    name: "Classic Rope Chain",
    category: "chains",
    collection: "classic",
    price: 7490,
    options: [GOLD, SILVER],
    sizes: CHAIN_LENGTHS,
    art: { kind: "chain", style: "rope" },
    rating: 4.7,
    reviews: 118,
    short: "A 3mm twisted rope chain with timeless texture.",
    description: "Dozens of tiny links twisted into a single rope, a traditional chain that pairs with any pendant in the collection.",
    details: ["3mm width", "Lobster clasp", "925 sterling silver base", "Pendant compatible"],
  },
  {
    slug: "box-chain",
    name: "Box Chain",
    category: "chains",
    collection: "modern",
    price: 3490,
    options: [SILVER, BLACK, GOLD],
    sizes: CHAIN_LENGTHS,
    art: { kind: "chain", style: "box" },
    rating: 4.7,
    reviews: 87,
    short: "A crisp, square-link everyday chain.",
    description: "Geometric links create a smooth, fluid chain that works on its own or as the base for any TATTV pendant.",
    details: ["1.6mm width", "925 sterling silver", "Lobster clasp", "Pendant compatible"],
  },

  // ——— Rings ———
  {
    slug: "heritage-signet-ring",
    name: "Heritage Signet Ring",
    category: "rings",
    collection: "classic",
    price: 6990,
    options: [GOLD, SILVER],
    sizes: RING_SIZES,
    art: { kind: "ring", style: "signet" },
    badge: "Bestseller",
    bestseller: true,
    rating: 4.9,
    reviews: 244,
    short: "An oval signet with a polished face, ready for engraving.",
    description:
      "A signet is a signature. Ours has a generous oval face and a tapered shank, weighted to sit comfortably on the little or ring finger.",
    details: ["Face: 14 × 11mm", "Solid 925 sterling silver", "Complimentary initial engraving", "Comfort-fit interior"],
  },
  {
    slug: "onyx-signet-ring",
    name: "Black Onyx Signet",
    category: "rings",
    collection: "classic",
    price: 7990,
    options: [SILVER, GOLD, BLACK],
    sizes: RING_SIZES,
    art: { kind: "ring", style: "onyx" },
    rating: 4.8,
    reviews: 133,
    short: "Polished black onyx set into a sterling signet.",
    description: "A deep black onyx inlay brings quiet drama to the classic signet. Each stone is hand-cut and individually set.",
    details: ["Natural black onyx", "Face: 15 × 12mm", "925 sterling silver", "Stone may vary slightly"],
  },
  {
    slug: "ridged-band-ring",
    name: "Ridged Band",
    category: "rings",
    collection: "modern",
    price: 4490,
    options: [BLACK, SILVER, GOLD],
    sizes: RING_SIZES,
    art: { kind: "ring", style: "ridged" },
    isNew: true,
    badge: "New",
    rating: 4.7,
    reviews: 29,
    short: "Three sculpted ridges in a 7mm architectural band.",
    description: "Inspired by brutalist façades, three crisp ridges add depth and shadow to a substantial 7mm band.",
    details: ["7mm width", "925 sterling silver", "Brushed and polished finish", "Comfort-fit interior"],
  },
  {
    slug: "classic-band-6mm",
    name: "Classic Band 6mm",
    category: "rings",
    collection: "classic",
    price: 3990,
    options: [SILVER, GOLD, BLACK],
    sizes: RING_SIZES,
    art: { kind: "ring", style: "band" },
    rating: 4.8,
    reviews: 189,
    short: "A pure, polished 6mm band.",
    description: "Uncomplicated and essential. A high-polish, domed band that pairs with everything and wears beautifully over time.",
    details: ["6mm width", "925 sterling silver", "High-polish finish", "Engravable interior"],
  },
  {
    slug: "chain-link-ring",
    name: "Chain Link Ring",
    category: "rings",
    collection: "modern",
    price: 3490,
    options: [STEEL, STEEL_BLACK, STEEL_GOLD],
    sizes: RING_SIZES,
    art: { kind: "ring", style: "link" },
    rating: 4.5,
    reviews: 71,
    short: "Interlocking curb links that flex with your hand.",
    description: "A full circle of solid curb links in 316L stainless steel. Flexible, tactile and impossible to ignore.",
    details: ["5mm links", "316L stainless steel", "Waterproof, won't tarnish", "Hypoallergenic"],
  },
  {
    slug: "monogram-t-ring",
    name: "Monogram T Signet",
    category: "rings",
    collection: "modern",
    price: 7490,
    options: [BLACK, SILVER, GOLD],
    sizes: RING_SIZES,
    art: { kind: "ring", style: "monogram" },
    badge: "Limited Edition",
    rating: 5,
    reviews: 22,
    short: "A square signet bearing the TATTV emblem.",
    description: "Our emblem translated into a modern square signet. Oxidised recesses make the interlocking T stand out in relief.",
    details: ["Face: 13 × 13mm", "925 sterling silver", "Oxidised relief detail", "Numbered edition of 500"],
  },

  // ——— Bracelets ———
  {
    slug: "cuban-curb-bracelet",
    name: "Cuban Curb Bracelet",
    category: "bracelets",
    collection: "classic",
    price: 8490,
    options: [SILVER, GOLD],
    sizes: WRIST_SIZES,
    art: { kind: "bracelet", style: "curb" },
    badge: "Bestseller",
    bestseller: true,
    rating: 4.9,
    reviews: 198,
    short: "The 8mm Cuban, scaled perfectly for the wrist.",
    description: "Our bestselling chain, reimagined for the wrist. Diamond-cut curb links with a secure box clasp.",
    details: ["8mm width", "925 sterling silver", "Box clasp with safety latch", "Pairs with the Cuban Link Chain"],
  },
  {
    slug: "onyx-bead-bracelet",
    name: "Onyx Bead Bracelet",
    category: "bracelets",
    collection: "modern",
    price: 2990,
    options: [SILVER, BLACK, GOLD],
    sizes: WRIST_SIZES,
    art: { kind: "bracelet", style: "beads", bead: "onyx" },
    bestseller: true,
    rating: 4.8,
    reviews: 265,
    short: "Matte black onyx beads with a sterling accent.",
    description: "8mm matte onyx beads on a durable stretch cord, finished with a single sterling silver accent bead.",
    details: ["8mm natural onyx beads", "Sterling silver accent bead", "Reinforced stretch cord", "Stackable"],
  },
  {
    slug: "tiger-eye-bead-bracelet",
    name: "Tiger Eye Bead Bracelet",
    category: "bracelets",
    collection: "classic",
    price: 2990,
    options: [GOLD, SILVER],
    sizes: WRIST_SIZES,
    art: { kind: "bracelet", style: "beads", bead: "tiger" },
    isNew: true,
    badge: "New",
    rating: 4.7,
    reviews: 34,
    short: "Warm, banded tiger eye with a gold-tone accent.",
    description: "Tiger eye has long been carried for focus and courage. Polished 8mm beads, finished with a vermeil accent.",
    details: ["8mm natural tiger eye", "Vermeil or silver accent bead", "Reinforced stretch cord", "Stackable"],
  },
  {
    slug: "lava-stone-bracelet",
    name: "Lava Stone Bracelet",
    category: "bracelets",
    collection: "modern",
    price: 2490,
    options: [BLACK, SILVER],
    sizes: WRIST_SIZES,
    art: { kind: "bracelet", style: "beads", bead: "lava" },
    rating: 4.6,
    reviews: 58,
    short: "Textured volcanic stone for a raw, modern edge.",
    description: "Porous lava stone beads with a tactile, matte finish. A drop of essential oil turns it into a subtle diffuser.",
    details: ["8mm lava stone", "Black rhodium accent bead", "Reinforced stretch cord", "Stackable"],
  },
  {
    slug: "open-cuff",
    name: "Sculpted Open Cuff",
    category: "bracelets",
    collection: "modern",
    price: 6990,
    options: [SILVER, BLACK, GOLD],
    sizes: WRIST_SIZES,
    art: { kind: "bracelet", style: "cuff" },
    rating: 4.8,
    reviews: 47,
    short: "A solid open cuff with a softly bevelled edge.",
    description: "Forged from a single bar of sterling silver, this cuff slips on from the side and sits close to the wrist.",
    details: ["8mm width", "Solid 925 sterling silver", "Slightly adjustable", "Approx. 32g"],
  },
  {
    slug: "braided-leather-bracelet",
    name: "Braided Leather Bracelet",
    category: "bracelets",
    collection: "modern",
    price: 2490,
    options: [...leather("leather-black", "leather-brown", "leather-tan")],
    sizes: WRIST_SIZES,
    art: { kind: "bracelet", style: "leather" },
    rating: 4.6,
    reviews: 112,
    short: "Hand-braided Italian leather with a magnetic steel clasp.",
    description: "Four strands of full-grain leather, hand-braided and finished with a secure magnetic clasp in brushed steel.",
    details: ["6mm braided leather", "Magnetic stainless steel clasp", "Avoid prolonged water contact", "Gift boxed"],
  },
  {
    slug: "box-link-bracelet",
    name: "Box Link Bracelet",
    category: "bracelets",
    collection: "classic",
    price: 4490,
    options: [SILVER, GOLD],
    sizes: WRIST_SIZES,
    art: { kind: "bracelet", style: "box" },
    rating: 4.7,
    reviews: 66,
    short: "Refined square links with a fluid drape.",
    description: "A slim box link bracelet that stacks effortlessly with a watch or a bead bracelet.",
    details: ["3mm width", "925 sterling silver", "Lobster clasp", "Stackable"],
  },

  // ——— Wallets ———
  {
    slug: "heritage-bifold-wallet",
    name: "Heritage Bifold Wallet",
    category: "wallets",
    collection: "classic",
    price: 3490,
    options: leather("leather-brown", "leather-black", "leather-tan"),
    art: { kind: "wallet", style: "bifold" },
    badge: "Bestseller",
    bestseller: true,
    rating: 4.8,
    reviews: 412,
    short: "Full-grain leather bifold with 8 card slots.",
    description:
      "Cut from vegetable-tanned full-grain leather that develops a rich patina with age. Hand-painted edges and a debossed TATTV emblem.",
    details: ["8 card slots, 2 note compartments", "Full-grain vegetable-tanned leather", "RFID blocking lining", "11.5 × 9.5cm closed"],
  },
  {
    slug: "slim-card-holder",
    name: "Slim Card Holder",
    category: "wallets",
    collection: "modern",
    price: 1990,
    options: leather("leather-black", "leather-navy", "leather-tan"),
    art: { kind: "wallet", style: "cardholder" },
    isNew: true,
    badge: "New",
    rating: 4.7,
    reviews: 95,
    short: "Four slots, one centre pocket, zero bulk.",
    description: "For the minimalist. Slips into a front pocket and holds everything you actually need.",
    details: ["4 card slots + centre pocket", "Saffiano-textured leather", "RFID blocking", "10 × 7cm"],
  },
  {
    slug: "zip-around-wallet",
    name: "Zip-Around Wallet",
    category: "wallets",
    collection: "classic",
    price: 4490,
    options: leather("leather-black", "leather-brown"),
    art: { kind: "wallet", style: "zip" },
    rating: 4.6,
    reviews: 53,
    short: "Secure zip closure with a dedicated coin pocket.",
    description: "A travel-ready wallet with a smooth metal zip, 12 card slots, a coin pocket and room for foreign currency.",
    details: ["12 card slots, coin pocket", "Full-grain leather", "Gunmetal YKK zip", "19 × 10cm"],
  },
  {
    slug: "modern-slim-bifold",
    name: "Modern Slim Bifold",
    category: "wallets",
    collection: "modern",
    price: 2790,
    options: leather("leather-navy", "leather-black"),
    art: { kind: "wallet", style: "bifold" },
    rating: 4.7,
    reviews: 140,
    short: "A pared-back bifold with clean, raw-cut edges.",
    description: "Everything you love about a bifold, minus a third of the bulk. Six card slots and a full-length note pocket.",
    details: ["6 card slots, 1 note compartment", "Pebbled full-grain leather", "RFID blocking", "11 × 9cm closed"],
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const getOption = (product: Product, optionId?: string) =>
  product.options.find((o) => o.id === optionId) ?? product.options[0];

export const unitPrice = (product: Product, optionId?: string) => product.price + (getOption(product, optionId).priceDelta ?? 0);

export const categoryName = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

export const materialOf = (tone: Tone) => (tone.startsWith("leather") ? "leather" : tone);

export const MATERIALS = [
  { id: "silver", name: "Sterling Silver" },
  { id: "gold", name: "Gold" },
  { id: "black", name: "Black Finish" },
  { id: "steel", name: "Stainless Steel" },
  { id: "leather", name: "Leather" },
] as const;

export const relatedProducts = (product: Product, count = 4) => {
  const sameCategory = PRODUCTS.filter((p) => p.slug !== product.slug && p.category === product.category);
  const others = PRODUCTS.filter((p) => p.category !== product.category && p.collection === product.collection);
  return [...sameCategory, ...others].slice(0, count);
};

export function searchProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter((p) =>
    [p.name, p.short, categoryName(p.category), p.collection, ...p.options.map((o) => o.label)]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

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
  /** Paths under /public. Cropped from TATTV's Instagram until original product shots are supplied. */
  images: string[];
  sizes?: { label: string; values: string[] };
  badge?: "New" | "Bestseller" | "Limited Edition";
  isNew?: boolean;
  bestseller?: boolean;
  short: string;
  description: string;
  details: string[];
}

export const CATEGORIES: { id: CategoryId; name: string; blurb: string; image: string }[] = [
  { id: "chains", name: "Chains", blurb: "Chains and pendants, layered or worn alone.", image: "/images/categories/chains.jpg" },
  { id: "rings", name: "Rings", blurb: "Signets, bands and sculpted forms made for everyday wear.", image: "/images/categories/rings.jpg" },
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
    blurb: "Time-honoured signets, bands and bangles that never ask for attention, and always get it.",
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
    collection: "modern",
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
    slug: "wave-tag-pendant",
    name: "Wave Tag Pendant",
    category: "chains",
    collection: "modern",
    price: 1299,
    material: "Gold-Plated Stainless Steel",
    finish: "two-tone",
    images: img("wave-tag-pendant"),
    sizes: CHAIN_LENGTHS,
    isNew: true,
    badge: "New",
    short: "A sculpted wave-pattern tag on a slim chain.",
    description: "Fluid diagonal ridges catch the light across this rectangular tag. Wear it alone or layered with a second chain.",
    details: ["Tag: 15 × 40mm", "2mm rope chain", "Stainless steel with 18K gold plating", "Water resistant"],
  },
  {
    slug: "gothic-cross-pendant",
    name: "Gothic Cross Pendant",
    category: "chains",
    collection: "classic",
    price: 1199,
    material: "Oxidised Stainless Steel",
    finish: "silver",
    images: img("gothic-cross-pendant"),
    sizes: CHAIN_LENGTHS,
    short: "An ornate cross with an antiqued finish.",
    description: "Detailed scrollwork and an oxidised finish give this cross pendant real depth. Hung on a sturdy wheat chain.",
    details: ["Pendant: 45mm", "3mm wheat chain", "Oxidised stainless steel", "Lobster clasp"],
  },
  {
    slug: "medallion-pendant",
    name: "Medallion Pendant",
    category: "chains",
    collection: "classic",
    price: 1399,
    material: "Oxidised Stainless Steel",
    finish: "silver",
    images: img("medallion-pendant"),
    sizes: CHAIN_LENGTHS,
    isNew: true,
    badge: "New",
    short: "An intricately engraved round medallion.",
    description: "A coin-style medallion with a deeply engraved star motif, finished by hand to bring out every detail.",
    details: ["Medallion: 30mm", "2.5mm cable chain", "Oxidised stainless steel", "Lobster clasp"],
  },
  {
    slug: "halo-ring-pendant",
    name: "Halo Ring Pendant",
    category: "chains",
    collection: "modern",
    price: 999,
    material: "Stainless Steel",
    finish: "silver",
    images: img("halo-ring-pendant"),
    sizes: CHAIN_LENGTHS,
    short: "A minimal open-circle pendant for everyday wear.",
    description: "A single polished ring on a fine chain: understated enough for every day, sharp over a knit or an open collar.",
    details: ["Pendant: 14mm", "1.5mm cable chain", "Stainless steel", "Hypoallergenic"],
  },

  // ——— Rings ———
  {
    slug: "stripe-signet-ring",
    name: "Stripe Signet Ring",
    category: "rings",
    collection: "classic",
    price: 1499,
    material: "Gold-Plated Stainless Steel",
    finish: "gold",
    images: img("stripe-signet-ring"),
    sizes: RING_SIZES,
    badge: "Bestseller",
    bestseller: true,
    short: "A bold signet with black enamel stripes and an emblem face.",
    description: "A substantial signet with a crest-engraved face flanked by black enamel stripes. Made to be noticed.",
    details: ["Face: 16 × 14mm", "Gold-plated stainless steel", "Black enamel detailing", "Comfort-fit interior"],
  },
  {
    slug: "classic-band-ring",
    name: "Classic Band Ring",
    category: "rings",
    collection: "classic",
    price: 899,
    material: "Stainless Steel",
    finish: "two-tone",
    images: img("classic-band-ring"),
    sizes: RING_SIZES,
    bestseller: true,
    short: "A brushed 6mm band with polished bevelled edges.",
    description: "Uncomplicated and essential. A brushed centre between polished edges, available in steel, black and gold tones.",
    details: ["6mm width", "Stainless steel", "Brushed and polished finish", "Comfort-fit interior"],
  },
  {
    slug: "onyx-square-ring",
    name: "Onyx Square Ring",
    category: "rings",
    collection: "modern",
    price: 1299,
    material: "Gold-Plated Stainless Steel",
    finish: "gold",
    images: img("onyx-square-ring", "onyx-square-ring-2"),
    sizes: RING_SIZES,
    short: "A square gold signet set with black onyx.",
    description: "A clean square face inlaid with polished black onyx, framed in gold-plated steel.",
    details: ["Face: 12 × 12mm", "Natural black onyx", "Gold-plated stainless steel", "Stone may vary slightly"],
  },
  {
    slug: "black-spinner-ring",
    name: "Black Spinner Ring",
    category: "rings",
    collection: "modern",
    price: 799,
    material: "Black IP Stainless Steel",
    finish: "black",
    images: img("black-spinner-ring"),
    sizes: RING_SIZES,
    isNew: true,
    badge: "New",
    short: "A matte black band with a rotating centre.",
    description: "A tactile spinner band in matte black steel. The centre ring turns freely, perfect for restless hands.",
    details: ["8mm width", "Black IP stainless steel", "Rotating centre band", "Scratch resistant"],
  },
  {
    slug: "lion-medallion-ring",
    name: "Lion Medallion Ring",
    category: "rings",
    collection: "classic",
    price: 1599,
    material: "Oxidised Stainless Steel",
    finish: "silver",
    images: img("lion-medallion-ring"),
    sizes: RING_SIZES,
    badge: "Limited Edition",
    short: "A round signet crowned with a lion's head.",
    description: "A regal round face with a detailed lion's head in relief, oxidised to bring out its texture.",
    details: ["Face: 18mm", "Oxidised stainless steel", "Relief detailing", "Limited run"],
  },

  // ——— Bracelets ———
  {
    slug: "mesh-cuff-bracelet",
    name: "Mesh Cuff Bracelet",
    category: "bracelets",
    collection: "modern",
    price: 1799,
    material: "Stainless Steel",
    finish: "black",
    images: img("mesh-cuff-bracelet"),
    sizes: WRIST_SIZES,
    badge: "Bestseller",
    bestseller: true,
    short: "A woven-mesh open cuff in black and steel.",
    description: "Finely woven steel mesh shaped into an open cuff that slips on from the side and sits close to the wrist.",
    details: ["10mm width", "Stainless steel mesh", "Open cuff, slightly adjustable", "Water resistant"],
  },
  {
    slug: "open-cuff-bracelet",
    name: "Open Cuff Bracelet",
    category: "bracelets",
    collection: "modern",
    price: 1299,
    material: "Stainless Steel",
    finish: "gold",
    images: img("open-cuff-bracelet"),
    sizes: WRIST_SIZES,
    short: "A slim, polished open cuff.",
    description: "A pared-back open cuff with softly rounded ends. Stack it with a watch or a leather bracelet.",
    details: ["4mm width", "Stainless steel", "Open cuff, slightly adjustable", "Stackable"],
  },
  {
    slug: "braided-leather-bracelet",
    name: "Braided Leather Bracelet",
    category: "bracelets",
    collection: "modern",
    price: 1099,
    material: "Genuine Leather & Steel",
    finish: "leather",
    images: img("braided-leather-bracelet", "braided-leather-bracelet-2"),
    sizes: WRIST_SIZES,
    bestseller: true,
    short: "Multi-strand braided leather with a gold-tone clasp.",
    description: "Several strands of braided black leather, finished with a secure magnetic clasp.",
    details: ["Multi-strand braided leather", "Magnetic stainless steel clasp", "Avoid prolonged water contact", "Gift boxed"],
  },
  {
    slug: "black-leather-bar-bracelet",
    name: "Leather Bar Bracelet",
    category: "bracelets",
    collection: "modern",
    price: 999,
    material: "Genuine Leather & Steel",
    finish: "leather",
    images: img("black-leather-bar-bracelet"),
    sizes: WRIST_SIZES,
    isNew: true,
    badge: "New",
    short: "Black braided leather with a brushed steel bar.",
    description: "A single braided leather cord finished with a brushed steel ID bar, ready to engrave.",
    details: ["6mm braided leather", "Brushed steel ID bar", "Fold-over clasp", "Engravable"],
  },
  {
    slug: "steel-kada-bracelet",
    name: "Steel Kada Bracelet",
    category: "bracelets",
    collection: "classic",
    price: 1299,
    material: "Stainless Steel",
    finish: "silver",
    images: img("steel-kada-bracelet"),
    sizes: WRIST_SIZES,
    short: "A solid steel kada with a textured inlay.",
    description: "A modern take on the traditional kada: solid polished steel with a textured centre inlay and a screw clasp.",
    details: ["8mm width", "Stainless steel", "Screw clasp", "Water resistant"],
  },
  {
    slug: "steel-bar-bracelet",
    name: "Steel Bar Bracelet",
    category: "bracelets",
    collection: "classic",
    price: 1199,
    material: "Stainless Steel",
    finish: "silver",
    images: img("steel-bar-bracelet"),
    sizes: WRIST_SIZES,
    short: "A rigid steel bangle with a twin-bar detail.",
    description: "Clean, architectural and comfortable: a polished steel bangle with a twin-bar centre.",
    details: ["6mm width", "Stainless steel", "Hinged clasp", "Water resistant"],
  },
  {
    slug: "gold-cable-bangle",
    name: "Gold Cable Bangle",
    category: "bracelets",
    collection: "classic",
    price: 1499,
    material: "Gold-Plated Stainless Steel",
    finish: "gold",
    images: img("gold-cable-bangle"),
    sizes: WRIST_SIZES,
    short: "A twisted cable bangle with a polished gold finish.",
    description: "Twisted cable detailing wraps a gold-tone bangle, finished with a discreet hinged clasp.",
    details: ["5mm width", "Gold-plated stainless steel", "Hinged clasp", "Stackable"],
  },
  {
    slug: "carbon-inlay-bangle",
    name: "Carbon Inlay Bangle",
    category: "bracelets",
    collection: "modern",
    price: 1599,
    material: "Gold-Plated Stainless Steel",
    finish: "two-tone",
    images: img("carbon-inlay-bangle"),
    sizes: WRIST_SIZES,
    isNew: true,
    badge: "New",
    short: "A gold-tone bangle with a black carbon-texture inlay.",
    description: "A polished gold-tone bangle set with a black textured inlay for contrast.",
    details: ["8mm width", "Gold-plated stainless steel", "Carbon-texture inlay", "Hinged clasp"],
  },

  // ——— Wallets ———
  {
    slug: "leather-bifold-wallet",
    name: "Leather Bifold Wallet",
    category: "wallets",
    collection: "classic",
    price: 1499,
    material: "Genuine Leather",
    finish: "leather",
    images: img("leather-bifold-wallet"),
    bestseller: true,
    short: "A slim genuine-leather bifold with six card slots.",
    description: "Soft genuine leather in a slim bifold with six card slots and a full-length note compartment.",
    details: ["6 card slots, 1 note compartment", "Genuine leather", "RFID blocking lining", "11 × 9cm closed"],
  },
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

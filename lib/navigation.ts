export interface NavLink {
  label: string;
  href: string;
}

export interface NavItem extends NavLink {
  columns?: { title: string; links: NavLink[] }[];
  featured?: string[];
}

const byStyle = (category: string, label: string): NavLink[] => [
  { label: `All ${label}`, href: `/shop?category=${category}` },
  { label: "Modern", href: `/shop?category=${category}&collection=modern` },
  { label: "Classic", href: `/shop?category=${category}&collection=classic` },
];

const byFinish = (category: string, extra: NavLink[] = []): NavLink[] => [
  { label: "Silver Tone", href: `/shop?category=${category}&material=silver` },
  { label: "Gold Tone", href: `/shop?category=${category}&material=gold` },
  { label: "Black", href: `/shop?category=${category}&material=black` },
  ...extra,
];

export const NAV: NavItem[] = [
  { label: "New Arrivals", href: "/shop?tag=new" },
  {
    label: "Chains",
    href: "/shop?category=chains",
    columns: [
      { title: "Shop", links: byStyle("chains", "Chains") },
      { title: "By Finish", links: byFinish("chains") },
    ],
    featured: ["star-dog-tag-pendant", "wave-tag-pendant"],
  },
  {
    label: "Rings",
    href: "/shop?category=rings",
    columns: [
      { title: "Shop", links: [...byStyle("rings", "Rings"), { label: "Size Guide", href: "/help#size-guide" }] },
      { title: "By Finish", links: byFinish("rings") },
    ],
    featured: ["stripe-signet-ring", "onyx-square-ring"],
  },
  {
    label: "Bracelets",
    href: "/shop?category=bracelets",
    columns: [
      { title: "Shop", links: byStyle("bracelets", "Bracelets") },
      { title: "By Finish", links: byFinish("bracelets", [{ label: "Leather", href: "/shop?category=bracelets&material=leather" }]) },
    ],
    featured: ["mesh-cuff-bracelet", "braided-leather-bracelet"],
  },
  { label: "Wallets", href: "/shop?category=wallets" },
  { label: "Gifts", href: "/shop?tag=gifts" },
  { label: "Our Story", href: "/about" },
];

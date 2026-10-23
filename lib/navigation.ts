export interface NavLink {
  label: string;
  href: string;
}

export interface NavItem extends NavLink {
  columns?: { title: string; links: NavLink[] }[];
  featured?: string[];
}

const byMaterial = (category: string): NavLink[] => [
  { label: "Sterling Silver", href: `/shop?category=${category}&material=silver` },
  { label: "Gold", href: `/shop?category=${category}&material=gold` },
  { label: "Black Finish", href: `/shop?category=${category}&material=black` },
];

export const NAV: NavItem[] = [
  { label: "New Arrivals", href: "/shop?tag=new" },
  {
    label: "Chains & Pendants",
    href: "/shop?category=chains",
    columns: [
      {
        title: "Shop",
        links: [
          { label: "All Chains & Pendants", href: "/shop?category=chains" },
          { label: "Modern", href: "/shop?category=chains&collection=modern" },
          { label: "Classic", href: "/shop?category=chains&collection=classic" },
        ],
      },
      { title: "By Material", links: [...byMaterial("chains"), { label: "Stainless Steel", href: "/shop?category=chains&material=steel" }] },
    ],
    featured: ["triangle-pendant", "cuban-link-chain"],
  },
  {
    label: "Rings",
    href: "/shop?category=rings",
    columns: [
      {
        title: "Shop",
        links: [
          { label: "All Rings", href: "/shop?category=rings" },
          { label: "Modern", href: "/shop?category=rings&collection=modern" },
          { label: "Classic", href: "/shop?category=rings&collection=classic" },
          { label: "Size Guide", href: "/help#size-guide" },
        ],
      },
      { title: "By Material", links: byMaterial("rings") },
    ],
    featured: ["heritage-signet-ring", "ridged-band-ring"],
  },
  {
    label: "Bracelets",
    href: "/shop?category=bracelets",
    columns: [
      {
        title: "Shop",
        links: [
          { label: "All Bracelets", href: "/shop?category=bracelets" },
          { label: "Modern", href: "/shop?category=bracelets&collection=modern" },
          { label: "Classic", href: "/shop?category=bracelets&collection=classic" },
        ],
      },
      { title: "By Material", links: [...byMaterial("bracelets"), { label: "Leather", href: "/shop?category=bracelets&material=leather" }] },
    ],
    featured: ["cuban-curb-bracelet", "onyx-bead-bracelet"],
  },
  {
    label: "Wallets",
    href: "/shop?category=wallets",
    columns: [
      {
        title: "Shop",
        links: [
          { label: "All Wallets", href: "/shop?category=wallets" },
          { label: "Modern", href: "/shop?category=wallets&collection=modern" },
          { label: "Classic", href: "/shop?category=wallets&collection=classic" },
        ],
      },
    ],
    featured: ["heritage-bifold-wallet", "slim-card-holder"],
  },
  {
    label: "Collections",
    href: "/collections",
    columns: [
      {
        title: "Collections",
        links: [
          { label: "Modern", href: "/shop?collection=modern" },
          { label: "Classic", href: "/shop?collection=classic" },
          { label: "Bestsellers", href: "/shop?tag=bestseller" },
        ],
      },
    ],
    featured: ["monogram-t-pendant", "onyx-signet-ring"],
  },
  { label: "Gifts", href: "/shop?tag=gifts" },
  { label: "Our Story", href: "/about" },
];

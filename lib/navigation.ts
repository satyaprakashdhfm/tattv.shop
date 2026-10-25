export interface NavLink {
  label: string;
  href: string;
}

export interface NavItem extends NavLink {
  columns?: { title: string; links: NavLink[] }[];
  featured?: string[];
}

// Dropdown columns/featured products are supported by the header; add them back once the catalogue is larger.
export const NAV: NavItem[] = [
  { label: "New Arrivals", href: "/shop?tag=new" },
  { label: "Earrings", href: "/shop?category=earrings" },
  { label: "Chains", href: "/shop?category=chains" },
  { label: "Rings", href: "/shop?category=rings" },
  { label: "Bracelets", href: "/shop?category=bracelets" },
  { label: "Daily Objects", href: "/shop?category=wallets" },
  { label: "Our Story", href: "/about" },
];

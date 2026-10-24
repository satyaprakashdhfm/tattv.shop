/** A rectangle as fractions (0–1) of the photo's width/height. */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TrendPanel {
  title: string;
  label: string;
  /** 3:4 photo under /public (prepared by scripts/prepare-trends.mjs). */
  image: string;
  href: string;
  cta: string;
  /** Where the item sits in the photo. */
  focus: Region;
  /** Where the thumbnail of the focus region is drawn; only x, y and width are used, height follows the focus shape. */
  inset: { x: number; y: number; w: number };
}

export const TRENDS: TrendPanel[] = [
  {
    title: "1. Layer Up",
    label: "Chains",
    image: "/images/trends/trend-1.jpg",
    href: "/shop?category=chains",
    cta: "Explore Chains",
    focus: { x: 0.31, y: 0.29, w: 0.47, h: 0.55 },
    inset: { x: 0.07, y: 0.655, w: 0.2 },
  },
  {
    title: "2. Make It Yours",
    label: "Rings",
    image: "/images/trends/trend-2.jpg",
    href: "/shop?category=rings",
    cta: "Explore Rings",
    focus: { x: 0.23, y: 0.385, w: 0.4, h: 0.25 },
    inset: { x: 0.68, y: 0.62, w: 0.24 },
  },
  {
    title: "3. Stack It Right",
    label: "Bracelets",
    image: "/images/trends/trend-3.jpg",
    href: "/shop?category=bracelets",
    cta: "Explore Bracelets",
    focus: { x: 0.14, y: 0.395, w: 0.37, h: 0.255 },
    inset: { x: 0.68, y: 0.43, w: 0.24 },
  },
];

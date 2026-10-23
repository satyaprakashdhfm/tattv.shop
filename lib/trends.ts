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
  /** Where the magnified close-up is drawn; only x, y and width are used, height follows the focus shape. */
  inset: { x: number; y: number; w: number };
}

export const TRENDS: TrendPanel[] = [
  {
    title: "1. Layer Up",
    label: "Chains",
    image: "/images/trends/trend-1.jpg",
    href: "/shop?category=chains",
    cta: "Explore Chains",
    focus: { x: 0.534, y: 0.654, w: 0.117, h: 0.156 },
    inset: { x: 0.07, y: 0.44, w: 0.3 },
  },
  {
    title: "2. Make It Yours",
    label: "Rings",
    image: "/images/trends/trend-2.jpg",
    href: "/shop?category=rings",
    cta: "Explore Rings",
    focus: { x: 0.391, y: 0.459, w: 0.117, h: 0.112 },
    inset: { x: 0.6, y: 0.52, w: 0.34 },
  },
  {
    title: "3. Stack It Right",
    label: "Bracelets",
    image: "/images/trends/trend-3.jpg",
    href: "/shop?category=bracelets",
    cta: "Explore Bracelets",
    focus: { x: 0.156, y: 0.415, w: 0.352, h: 0.215 },
    inset: { x: 0.05, y: 0.67, w: 0.42 },
  },
];

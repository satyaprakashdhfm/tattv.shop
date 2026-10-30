import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: {
    default: "TATTV | Men's Jewellery: Chains, Pendants, Rings, Bracelets & Wallets",
    template: "%s | TATTV",
  },
  description:
    "TATTV crafts modern and classic men's jewellery in stainless steel and genuine leather. Energize your style element.",
  metadataBase: new URL(SITE_URL),
  applicationName: "TATTV",
  keywords: ["men's jewellery", "men's chains", "men's rings", "men's bracelets", "stainless steel jewellery", "leather wallets", "TATTV"],
  openGraph: {
    type: "website",
    siteName: "TATTV",
    locale: "en_IN",
    url: "/",
    images: [{ url: "/images/banners/editorial.jpg", alt: "TATTV men's jewellery" }],
  },
  twitter: { card: "summary_large_image" },
  // Search Console ownership check (HTML tag method): set GOOGLE_SITE_VERIFICATION to the content="…" value.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { SearchOverlay } from "@/components/search-overlay";

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
    "TATTV crafts modern and classic men's jewellery in sterling silver, gold vermeil and full-grain leather. Energize your style element.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="min-h-screen flex flex-col">
        <StoreProvider>
          <AnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <SearchOverlay />
        </StoreProvider>
      </body>
    </html>
  );
}

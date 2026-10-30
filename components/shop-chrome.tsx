import type { ReactNode } from "react";
import { connection } from "next/server";
import { getClientCatalog } from "@/lib/server/catalog";
import { StoreProvider } from "./store-provider";
import { AnnouncementBar } from "./announcement-bar";
import { Header } from "./header";
import { Footer } from "./footer";
import { CartDrawer } from "./cart-drawer";
import { SearchOverlay } from "./search-overlay";
import { CheckoutBar } from "./checkout-bar";
import { WhatsAppButton } from "./whatsapp-button";
import { ReviewPopup } from "./review-popup";

/** Ribbon, header, footer and bag state around every storefront page (and the 404 page). The catalogue is loaded here once per request. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  // Always render per request (the 404 page would otherwise be prerendered at build time, when there's no database).
  await connection();
  const catalogData = await getClientCatalog();
  return (
    <StoreProvider catalogData={catalogData}>
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer settings={catalogData.settings} />
      <CartDrawer />
      <SearchOverlay />
      <CheckoutBar />
      <WhatsAppButton />
      <ReviewPopup />
    </StoreProvider>
  );
}

import type { Metadata } from "next";
import { paymentConfig } from "@/lib/server/orders";
import { loadCatalogData } from "@/lib/server/catalog";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const { online, cod } = paymentConfig();
  const { settings } = await loadCatalogData();
  // Cash on delivery takes its advance online, so it needs online payment unless the advance is 0%.
  return <CheckoutClient online={online} cod={cod && (settings.codAdvancePercent === 0 || !!online)} />;
}

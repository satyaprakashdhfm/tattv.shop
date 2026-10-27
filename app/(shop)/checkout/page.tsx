import type { Metadata } from "next";
import { paymentConfig } from "@/lib/server/orders";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  const { online, cod } = paymentConfig();
  return <CheckoutClient online={online} cod={cod} />;
}

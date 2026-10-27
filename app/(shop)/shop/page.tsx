import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "./shop-view";

export const metadata: Metadata = {
  title: "Shop Men's Jewellery",
  description: "Shop TATTV chains, pendants, rings, bracelets and leather wallets for men.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <ShopView />
    </Suspense>
  );
}

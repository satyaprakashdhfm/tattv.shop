"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";
import { PRODUCTS } from "@/lib/products";

export default function WishlistPage() {
  const { wishlist } = useStore();
  const items = PRODUCTS.filter((p) => wishlist.includes(p.slug));

  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="display text-5xl">Wishlist</h1>
      <p className="mt-2 text-sm text-muted">
        {items.length} saved {items.length === 1 ? "piece" : "pieces"}
      </p>
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <Heart size={36} strokeWidth={1} />
          <p className="display mt-6 text-3xl">Nothing saved yet</p>
          <p className="mt-2 text-sm text-muted">Tap the heart on any piece to keep it here.</p>
          <Link href="/shop" className="btn btn-dark mt-8">
            Explore the Collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

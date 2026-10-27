"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";

export default function WishlistPage() {
  const { wishlist, catalog } = useStore();
  const items = catalog.products.filter((p) => wishlist.includes(p.slug));

  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="title text-xl md:text-2xl">Wishlist</h1>
      <p className="mt-2 text-sm text-muted">
        {items.length} saved {items.length === 1 ? "piece" : "pieces"}
      </p>
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <Heart size={36} strokeWidth={1} />
          <p className="title mt-6 text-base md:text-lg">Nothing saved yet</p>
          <p className="mt-2 text-sm text-muted">Tap the heart on any piece to keep it here.</p>
          <Link href="/shop" className="btn btn-dark mt-8">
            Explore the Collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

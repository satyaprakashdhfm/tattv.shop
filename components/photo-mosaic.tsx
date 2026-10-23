import { getProduct } from "@/lib/products";
import { ProductImage } from "./product-image";

/** 2×2 grid of product photos, used where one large photo would be too low-resolution. */
export function PhotoMosaic({ slugs, className = "" }: { slugs: string[]; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-px ${className}`}>
      {slugs.map((slug) => {
        const p = getProduct(slug);
        return p ? (
          <div key={slug} className="relative aspect-square overflow-hidden">
            <ProductImage product={p} sizes="(min-width: 768px) 25vw, 50vw" className="transition-transform duration-[1.5s] group-hover:scale-105" />
          </div>
        ) : null;
      })}
    </div>
  );
}

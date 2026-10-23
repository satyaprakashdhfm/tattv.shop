import Image from "next/image";
import type { Product } from "@/lib/products";

/** Fills its (relative, sized) parent with one of the product's photos. */
export function ProductImage({
  product,
  index = 0,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
  className = "",
}: {
  product: Product;
  index?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={product.images[index] ?? product.images[0]}
      alt={product.name}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}

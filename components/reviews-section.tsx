import Link from "next/link";
import { Quote } from "lucide-react";
import { getProduct } from "@/lib/products";
import { REVIEWS, SHOW_REVIEWS } from "@/lib/reviews";
import { ProductImage } from "./product-image";

/** "What our customers say": quote cards, each linked to the piece it is about. */
export function ReviewsSection() {
  if (!SHOW_REVIEWS) return null;
  return (
    <section className="border-t border-line bg-white py-14 md:py-20">
      <div className="container-x">
        <div className="mb-8 text-center md:mb-10">
          <h2 className="title text-lg md:text-xl">What Our Customers Say</h2>
          <p className="mt-3 text-sm text-muted">Worn every day, by men across India.</p>
        </div>
        <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-3">
          {REVIEWS.map((r) => {
            const product = getProduct(r.product);
            return (
              <li key={r.name} className="flex w-[82%] shrink-0 snap-start flex-col border border-line bg-paper p-6 sm:w-[60%] md:w-auto">
                <Quote size={22} strokeWidth={1.3} className="text-gold" />
                <blockquote className="mt-4 flex-1 leading-relaxed text-ink/80">{r.quote}</blockquote>
                <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4">
                  <p className="text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted"> · {r.city}</span>
                  </p>
                  {product && (
                    <Link href={`/product/${product.slug}`} className="group flex min-w-0 items-center gap-2 text-xs text-muted hover:text-ink">
                      <span className="truncate">{product.name}</span>
                      <span className="relative size-9 shrink-0 overflow-hidden rounded-sm bg-sand">
                        <ProductImage product={product} sizes="36px" />
                      </span>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

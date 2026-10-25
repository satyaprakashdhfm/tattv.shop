"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Check, Heart, Minus, Package, Plus, RotateCcw, Truck } from "lucide-react";
import { COLLECTIONS, categoryName, type Product } from "@/lib/products";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { useStore } from "@/components/store-provider";

function deliveryDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [viewIndex, setViewIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>("Description");
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);

  const saved = wishlist.includes(product.slug);
  const price = product.price;
  const collection = COLLECTIONS.find((c) => c.id === product.collection)!;

  const handleAdd = () => {
    if (product.sizes && !size) {
      setSizeError(true);
      return;
    }
    addToCart({ slug: product.slug, size: size ?? undefined }, qty);
  };

  const panels = [
    { title: "Description", body: <p>{product.description}</p> },
    {
      title: "Details",
      body: (
        <ul className="space-y-2">
          {product.details.map((d) => (
            <li key={d} className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink" /> {d}
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "Care",
      body:
        product.finish === "leather" ? (
          <p>Wipe clean with a soft dry cloth. Condition every few months and keep away from direct heat and prolonged moisture to preserve the patina.</p>
        ) : (
          <ul className="space-y-2">
            <li>Store in the TATTV pouch, away from moisture and perfume.</li>
            <li>Wipe gently with a soft, dry cloth after wearing.</li>
            <li>Remove before swimming, showering or exercising.</li>
          </ul>
        ),
    },
    {
      title: "Shipping & Returns",
      body: (
        <p>
          Complimentary insured shipping on orders above {formatPrice(FREE_SHIPPING_THRESHOLD)}. Dispatched within 24 hours. Returns and exchanges accepted within 15 days of
          delivery (engraved pieces are final sale).
        </p>
      ),
    },
  ];

  return (
    <section className="container-x grid gap-8 py-6 md:py-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
      {/* Gallery */}
      <div className="min-w-0">
        <div className="flex flex-col-reverse gap-3 md:flex-row">
          {product.images.length > 1 && (
            <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-[72px] md:shrink-0 md:flex-col">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setViewIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative aspect-square w-[72px] shrink-0 overflow-hidden border transition ${viewIndex === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <ProductImage product={product} index={i} sizes="72px" />
                </button>
              ))}
            </div>
          )}
          <div className="relative aspect-square flex-1 overflow-hidden bg-sand">
            <ProductImage key={viewIndex} product={product} index={viewIndex} priority sizes="(min-width: 1024px) 45vw, 100vw" className="animate-fade-in" />
            {product.badge && <span className="absolute left-4 top-4 bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em]">{product.badge}</span>}
          </div>
        </div>
      </div>

      {/* Buy box */}
      <div className="min-w-0 lg:max-w-[520px]">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow text-muted">
            {collection.name} Collection · {categoryName(product.category)}
          </p>
          <h1 className="display mt-3 text-[32px] font-normal leading-[1.1] md:text-[40px]">{product.name}</h1>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xl font-medium">{formatPrice(price)}</span>
            {product.compareAt && <span className="text-base text-muted line-through">{formatPrice(product.compareAt)}</span>}
            <span className="text-xs text-muted">Inclusive of all taxes</span>
          </p>
          <p className="mt-5 leading-relaxed text-ink/75">{product.short}</p>

          <div className="mt-7 border-t border-line pt-6">
            <dl className="flex gap-2 text-sm">
              <dt className="text-muted">Material</dt>
              <dd className="font-medium">{product.material}</dd>
            </dl>

            {/* Size */}
            {product.sizes && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <p>
                    <span className="text-muted">{product.sizes.label}</span>
                    {size && <span className="ml-2 font-medium">{size}</span>}
                  </p>
                  <Link href="/help#size-guide" className="text-xs text-muted underline underline-offset-4 hover:text-ink">
                    Size Guide
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.values.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSize(s);
                        setSizeError(false);
                      }}
                      aria-pressed={size === s}
                      className={`h-10 min-w-14 border px-3 text-[13px] transition ${size === s ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {sizeError && <p className="mt-2 text-sm text-red-700">Please select a {product.sizes.label.toLowerCase()}.</p>}
              </div>
            )}
          </div>

          {/* Add to bag */}
          <div className="mt-7 flex gap-3">
            <div className="flex h-12 items-center border border-line bg-white">
              <button aria-label="Decrease quantity" className="flex h-full w-10 items-center justify-center hover:bg-sand" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={14} />
              </button>
              <span className="w-7 text-center text-sm">{qty}</span>
              <button aria-label="Increase quantity" className="flex h-full w-10 items-center justify-center hover:bg-sand" onClick={() => setQty((q) => Math.min(10, q + 1))}>
                <Plus size={14} />
              </button>
            </div>
            <button onClick={handleAdd} className="btn btn-dark flex-1 !px-4">
              Add to Bag
            </button>
            <button
              onClick={() => toggleWishlist(product.slug)}
              aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={saved}
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-line bg-white hover:border-ink"
            >
              <Heart size={18} strokeWidth={1.5} className={saved ? "fill-ink" : ""} />
            </button>
          </div>

          {/* Delivery check */}
          <form
            className="mt-4 flex items-center gap-3 border-b border-line"
            onSubmit={(e) => {
              e.preventDefault();
              setPinResult(/^\d{6}$/.test(pincode) ? `Delivery by ${deliveryDate(pincode.startsWith("1") || pincode.startsWith("4") || pincode.startsWith("5") || pincode.startsWith("6") ? 2 : 4)}` : "Please enter a valid 6-digit pincode");
            }}
          >
            <Truck size={17} strokeWidth={1.3} className="shrink-0 text-muted" />
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="Enter pincode for delivery date"
              aria-label="Pincode"
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
            <button type="submit" className="text-[11px] font-medium uppercase tracking-[0.16em] hover:underline hover:underline-offset-4">
              Check
            </button>
          </form>
          {pinResult && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Check size={14} /> {pinResult}
            </p>
          )}

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
            <li className="flex items-center gap-2">
              <BadgeCheck size={16} strokeWidth={1.3} /> Quality checked
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw size={16} strokeWidth={1.3} /> 15-day returns
            </li>
            <li className="flex items-center gap-2">
              <Package size={16} strokeWidth={1.3} /> Secure packaging
            </li>
          </ul>

          {/* Accordions */}
          <div className="mt-7 divide-y divide-line border-y border-line">
            {panels.map((panel) => {
              const open = openPanel === panel.title;
              return (
                <div key={panel.title}>
                  <button
                    className="flex w-full items-center justify-between py-4 text-left text-[12px] font-medium uppercase tracking-[0.18em]"
                    onClick={() => setOpenPanel(open ? null : panel.title)}
                    aria-expanded={open}
                  >
                    {panel.title}
                    {open ? <Minus size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
                  </button>
                  {open && <div className="animate-fade-in pb-5 text-sm leading-relaxed text-ink/75">{panel.body}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

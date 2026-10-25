"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Check, Heart, Minus, Package, Plus, RotateCcw, Truck } from "lucide-react";
import { COLLECTIONS, MATERIALS, categoryName, type Product } from "@/lib/products";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { useStore } from "@/components/store-provider";

function deliveryDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** Gallery views: every photo, plus a close-up of the first so each product has at least two. */
interface View {
  index: number;
  closeUp?: boolean;
}

const galleryViews = (product: Product): View[] => [...product.images.map((_, index) => ({ index })), { index: 0, closeUp: true }];

const TYPE_LABEL: Record<Product["category"], string> = {
  chains: "Chain / Pendant",
  rings: "Ring",
  bracelets: "Bracelet",
  wallets: "Wallet",
};

/** Spec rows for the Details table, built from the catalogue fields and the free-text details. */
function specRows(product: Product): [string, string][] {
  // Clasp lines also mention sizes ("2mm box chain with lobster clasp"), so skip them when picking dimensions.
  const dimension = product.details.find((d) => /:\s*\d|\d\s*(mm|cm)/i.test(d) && !/clasp|closure|zip|snap/i.test(d));
  const leather = product.finish === "leather";
  const rows: [string, string][] = [
    ["Material", product.material],
    ["Finish", MATERIALS.find((m) => m.id === product.finish)?.name ?? product.finish],
    ["Type", TYPE_LABEL[product.category]],
  ];
  if (dimension) rows.push(["Dimensions", dimension.replace(/^[^:]*:\s*/, "")]);
  if (product.sizes) rows.push([product.sizes.label === "Length" ? "Lengths" : "Sizes", product.sizes.values.join(", ")]);
  rows.push(["Tarnish-Free", leather ? "Not applicable" : "Yes"]);
  rows.push(["Country of Origin", "India"]);
  return rows;
}

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [viewIndex, setViewIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [tab, setTab] = useState("Description");
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);

  const saved = wishlist.includes(product.slug);
  const price = product.price;
  const collection = COLLECTIONS.find((c) => c.id === product.collection)!;
  const views = galleryViews(product);
  const view = views[viewIndex];

  const handleAdd = () => {
    if (product.sizes && !size) {
      setSizeError(true);
      return;
    }
    addToCart({ slug: product.slug, size: size ?? undefined }, qty);
  };

  const tabs: { title: string; body: React.ReactNode }[] = [
    {
      title: "Description",
      body: (
        <div className="space-y-3">
          <p>{product.description}</p>
          <ul className="space-y-1.5">
            {product.details.map((d) => (
              <li key={d} className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink" /> {d}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "Details",
      body: (
        <table className="w-full overflow-hidden border border-line text-sm">
          <tbody>
            {specRows(product).map(([label, value], i) => (
              <tr key={label} className={i % 2 ? "bg-white" : "bg-sand"}>
                <th scope="row" className="w-[42%] border-b border-line px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                  {label}
                </th>
                <td className="border-b border-line px-4 py-3 text-ink/80">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <div className="space-y-3">
          <p>Complimentary insured shipping on orders above {formatPrice(FREE_SHIPPING_THRESHOLD)}. Dispatched within 24 hours.</p>
          <p>Returns and exchanges accepted within 15 days of delivery (engraved pieces are final sale).</p>
        </div>
      ),
    },
  ];
  const activeTab = tabs.find((t) => t.title === tab) ?? tabs[0];

  return (
    <section className="container-x grid items-start gap-8 py-6 md:py-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
      {/* Gallery: stays pinned while the details column scrolls; hovering (or tapping/focusing) a thumbnail shows it. */}
      <div className="min-w-0 lg:sticky lg:top-24">
        <div className="flex flex-col-reverse gap-3 md:flex-row">
          <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-[76px] md:shrink-0 md:flex-col">
            {views.map((v, i) => (
              <button
                key={i}
                onMouseEnter={() => setViewIndex(i)}
                onFocus={() => setViewIndex(i)}
                onClick={() => setViewIndex(i)}
                aria-label={`View ${v.closeUp ? "close-up" : `image ${v.index + 1}`}`}
                aria-current={viewIndex === i}
                className={`relative aspect-square w-[76px] shrink-0 overflow-hidden border-2 bg-sand transition-colors ${
                  viewIndex === i ? "border-ink" : "border-transparent hover:border-line"
                }`}
              >
                <ProductImage product={product} index={v.index} sizes="76px" className={v.closeUp ? "scale-[1.9]" : ""} />
              </button>
            ))}
          </div>
          <div className="relative aspect-square flex-1 overflow-hidden border border-line bg-sand">
            <ProductImage
              key={viewIndex}
              product={product}
              index={view.index}
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className={`animate-fade-in ${view.closeUp ? "scale-[1.9]" : ""}`}
            />
            {(product.soldOut || product.badge) && (
              <span className={`absolute left-4 top-4 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${product.soldOut ? "bg-ink text-white" : "bg-white"}`}>
                {product.soldOut ? "Sold Out" : product.badge}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buy box */}
      <div className="min-w-0 lg:max-w-[540px]">
        <div>
          <p className="eyebrow text-muted">
            {collection.name} Collection · {categoryName(product.category)}
          </p>
          <h1 className="display mt-3 text-[32px] font-normal leading-[1.1] md:text-[40px]">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="flex items-baseline gap-2">
              <span className="text-2xl font-medium">{formatPrice(price)}</span>
              {product.compareAt && <span className="text-base text-muted line-through">{formatPrice(product.compareAt)}</span>}
            </p>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${product.soldOut ? "text-muted" : "text-emerald-700"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${product.soldOut ? "bg-muted" : "bg-emerald-600"}`} />
              {product.soldOut ? "Out of stock" : "In stock"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
          <p className="mt-5 leading-relaxed text-ink/75">{product.short}</p>

          {/* Options */}
          <div className="mt-7 space-y-6 border-t border-line pt-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Material</p>
              <p className="mt-2 inline-block border border-line bg-white px-3 py-1.5 text-sm">{product.material}</p>
            </div>

            {product.sizes && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                    {product.sizes.label}
                    {size && <span className="ml-2 font-normal normal-case tracking-normal text-muted">{size}</span>}
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
            {product.soldOut ? (
              <button disabled className="btn flex-1 border border-line bg-sand !px-4 text-muted">
                Sold Out
              </button>
            ) : (
              <button onClick={handleAdd} className="btn btn-dark flex-1 !px-4">
                Add to Bag · {formatPrice(price * qty)}
              </button>
            )}
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
            className="mt-4 flex items-center gap-3 border border-line bg-white px-4"
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
            <button type="submit" className="text-[11px] font-semibold uppercase tracking-[0.16em] hover:underline hover:underline-offset-4">
              Check
            </button>
          </form>
          {pinResult && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Check size={14} /> {pinResult}
            </p>
          )}

          <ul className="mt-5 grid grid-cols-3 border border-line bg-white text-center text-[11px] text-ink/75">
            <li className="flex flex-col items-center gap-1.5 px-2 py-3">
              <BadgeCheck size={18} strokeWidth={1.3} /> Quality checked
            </li>
            <li className="flex flex-col items-center gap-1.5 border-x border-line px-2 py-3">
              <RotateCcw size={18} strokeWidth={1.3} /> 15-day returns
            </li>
            <li className="flex flex-col items-center gap-1.5 px-2 py-3">
              <Package size={18} strokeWidth={1.3} /> Secure packaging
            </li>
          </ul>

          {/* Tabs */}
          <div className="mt-9">
            <div role="tablist" aria-label="Product information" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line">
              {tabs.map((t) => (
                <button
                  key={t.title}
                  role="tab"
                  id={`tab-${t.title}`}
                  aria-selected={t.title === activeTab.title}
                  aria-controls="product-tabpanel"
                  onClick={() => setTab(t.title)}
                  className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                    t.title === activeTab.title ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
            <div id="product-tabpanel" role="tabpanel" aria-labelledby={`tab-${activeTab.title}`} className="animate-fade-in pt-5 text-sm leading-relaxed text-ink/75">
              {activeTab.body}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

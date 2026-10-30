"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, Check, Heart, Minus, Package, Plus, RotateCcw, ShoppingBag, Truck, Play } from "lucide-react";
import { MATERIALS, type Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { defaultCare, defaultShippingReturns } from "@/lib/product-copy";
import { ProductImage } from "@/components/product-image";
import { useStore } from "@/components/store-provider";

function deliveryDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** Gallery views: every photo, the product's video (second, after the main photo), and a close-up of the first photo. */
interface View {
  index: number;
  closeUp?: boolean;
  video?: string;
}

const galleryViews = (product: Product): View[] => {
  const photos: View[] = product.images.map((_, index) => ({ index }));
  if (product.video) photos.splice(1, 0, { index: 0, video: product.video });
  return [...photos, { index: 0, closeUp: true }];
};

const TYPE_LABEL: Record<string, string> = {
  chains: "Chain / Pendant",
  rings: "Ring",
  bracelets: "Bracelet",
  wallets: "Wallet",
  earrings: "Earrings",
};

/** Spec rows for the Details table, built from the catalogue fields and the free-text details. */
function specRows(product: Product, categoryName: string): [string, string][] {
  // Clasp lines also mention sizes ("2mm box chain with lobster clasp"), so skip them when picking dimensions.
  const dimension = product.details.find((d) => /:\s*\d|\d\s*(mm|cm)/i.test(d) && !/clasp|closure|zip|snap/i.test(d));
  const leather = product.finish === "leather";
  const rows: [string, string][] = [
    ["Material", product.material],
    ["Finish", MATERIALS.find((m) => m.id === product.finish)?.name ?? product.finish],
    ["Type", TYPE_LABEL[product.category] ?? categoryName],
  ];
  if (dimension) rows.push(["Dimensions", dimension.replace(/^[^:]*:\s*/, "")]);
  if (product.sizes) rows.push([product.sizes.label === "Length" ? "Lengths" : "Sizes", product.sizes.values.join(", ")]);
  rows.push(["Tarnish-Free", leather ? "Not applicable" : "Yes"]);
  rows.push(["Country of Origin", "India"]);
  return rows;
}

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist, catalog, cart, limitFor } = useStore();
  const { categoryName } = catalog;
  const inBag = cart.filter((l) => l.slug === product.slug).reduce((n, l) => n + l.qty, 0);
  const maxMore = Math.max(0, limitFor(product.slug) - inBag);
  const lowStock = product.stock != null && product.stock > 0 && product.stock <= 5;
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [viewIndex, setViewIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [tab, setTab] = useState("Description");
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);

  const saved = wishlist.includes(product.slug);
  const price = product.price;
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
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" /> {d}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "Details",
      body: (
        <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-warm-line text-sm">
          <tbody>
            {specRows(product, categoryName(product.category)).map(([label, value], i) => (
              <tr key={label} className={i % 2 ? "bg-white" : "bg-[#faf5ee]"}>
                <th scope="row" className="w-[42%] border-b border-warm-line px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-espresso [tr:last-child_&]:border-b-0">
                  {label}
                </th>
                <td className="border-b border-warm-line px-4 py-3 text-espresso/80 [tr:last-child_&]:border-b-0">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      title: "Care",
      body: <Points lines={product.care ?? defaultCare(product.finish)} />,
    },
    {
      title: "Shipping & Returns",
      body: <Points lines={product.shippingReturns ?? defaultShippingReturns(catalog.settings)} />,
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
                aria-label={v.video ? "Play the video" : `View ${v.closeUp ? "close-up" : `image ${v.index + 1}`}`}
                aria-current={viewIndex === i}
                className={`relative aspect-square w-[76px] shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition-colors ${
                  viewIndex === i ? "border-gold" : "border-warm-line hover:border-gold/50"
                }`}
              >
                <ProductImage product={product} index={v.index} sizes="76px" className={v.closeUp ? "scale-[1.9]" : ""} />
                {v.video && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-espresso">
                      <Play size={14} fill="currentColor" />
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative aspect-square flex-1 overflow-hidden rounded-[2rem] border border-warm-line bg-white shadow-soft">
            {view.video ? (
              <video key={view.video} src={view.video} autoPlay muted loop playsInline controls aria-label={`${product.name}, video`} className="size-full animate-fade-in object-cover" />
            ) : (
              <HoverZoom scale={view.closeUp ? 1.5 : 2}>
                <ProductImage
                  key={viewIndex}
                  product={product}
                  index={view.index}
                  priority
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className={`animate-fade-in ${view.closeUp ? "scale-[1.9]" : ""}`}
                />
              </HoverZoom>
            )}
            {(product.soldOut || product.badge) && (
              <span className={`absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${product.soldOut ? "bg-espresso text-white" : "border border-gold/40 bg-bronze-soft text-espresso"}`}>
                {product.soldOut ? "Sold Out" : product.badge}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buy box */}
      <div className="min-w-0 lg:max-w-[540px]">
        <div>
          <Link href={`/shop?category=${product.category}`} className="eyebrow group inline-flex items-center gap-2 text-gold hover:text-espresso">
            <ArrowLeft size={13} strokeWidth={1.8} className="transition-transform group-hover:-translate-x-1" />
            {categoryName(product.category)}
          </Link>
          <h1 className="display mt-3 text-[32px] font-normal leading-[1.1] text-espresso md:text-[40px]">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-espresso">{formatPrice(price)}</span>
              {product.compareAt && <span className="text-base text-muted line-through">{formatPrice(product.compareAt)}</span>}
            </p>
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${product.soldOut ? "bg-sand-dark text-muted" : "bg-emerald-50 text-emerald-700"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${product.soldOut ? "bg-muted" : "bg-emerald-600"}`} />
              {product.soldOut ? "Out of stock" : lowStock ? `Only ${product.stock} left` : "In stock"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
          <p className="mt-5 leading-relaxed text-espresso/75">{product.short}</p>

          {/* Options */}
          <div className="mt-7 space-y-6 border-t border-warm-line pt-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-espresso">Material</p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-bronze-soft px-3.5 py-2 text-sm font-medium text-espresso">
                <Check size={14} className="text-gold" /> {product.material}
              </p>
            </div>

            {product.sizes && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-espresso">
                    {product.sizes.label}
                    {size && <span className="ml-2 font-normal normal-case tracking-normal text-muted">{size}</span>}
                  </p>
                  <Link href="/help#size-guide" className="text-xs font-medium text-gold underline underline-offset-4 hover:text-espresso">
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
                      className={`h-10 min-w-14 rounded-full border px-4 text-[13px] transition ${size === s ? "border-gold bg-bronze-soft font-semibold text-espresso" : "border-warm-line bg-white text-espresso/80 hover:border-gold/60"}`}
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
            <div className="flex h-12 items-center overflow-hidden rounded-full border border-warm-line bg-white text-espresso">
              <button aria-label="Decrease quantity" className="flex h-full w-10 items-center justify-center hover:bg-cream" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={14} />
              </button>
              <span className="w-7 text-center text-sm">{qty}</span>
              <button aria-label="Increase quantity" className="flex h-full w-10 items-center justify-center hover:bg-cream" onClick={() => setQty((q) => Math.min(Math.max(1, maxMore), q + 1))}>
                <Plus size={14} />
              </button>
            </div>
            {product.soldOut ? (
              <button disabled className="btn flex-1 border border-warm-line bg-sand-dark !px-4 text-muted">
                Sold Out
              </button>
            ) : (
              <button onClick={handleAdd} className="btn flex-1 bg-espresso !px-4 text-white shadow-[0_6px_16px_-8px_rgba(43,33,26,0.6)] hover:bg-espresso-hover">
                <ShoppingBag size={16} strokeWidth={1.6} /> Add to Bag · {formatPrice(price * qty)}
              </button>
            )}
            <button
              onClick={() => toggleWishlist(product.slug)}
              aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={saved}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-warm-line bg-white text-espresso transition-colors hover:border-gold"
            >
              <Heart size={18} strokeWidth={1.5} className={saved ? "fill-gold text-gold" : ""} />
            </button>
          </div>

          {/* Delivery check */}
          <form
            className="mt-4 flex items-center gap-3 rounded-full border border-warm-line bg-white py-1.5 pl-5 pr-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              setPinResult(/^\d{6}$/.test(pincode) ? `Delivery by ${deliveryDate(pincode.startsWith("1") || pincode.startsWith("4") || pincode.startsWith("5") || pincode.startsWith("6") ? 2 : 4)}` : "Please enter a valid 6-digit pincode");
            }}
          >
            <Truck size={17} strokeWidth={1.4} className="shrink-0 text-gold" />
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="Enter pincode for delivery date"
              aria-label="Pincode"
              className="h-9 min-w-0 flex-1 bg-transparent text-sm text-espresso outline-none placeholder:text-muted"
            />
            <button type="submit" className="h-9 shrink-0 rounded-full bg-espresso px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-espresso-hover">
              Check
            </button>
          </form>
          {pinResult && (
            <p className="mt-2 flex items-center gap-2 text-sm text-espresso">
              <Check size={14} className="text-gold" /> {pinResult}
            </p>
          )}

          <ul className="mt-5 grid grid-cols-3 overflow-hidden rounded-3xl border border-warm-line bg-white text-center text-[11px] text-espresso/80">
            <li className="flex flex-col items-center gap-1.5 px-2 py-3.5">
              <BadgeCheck size={18} strokeWidth={1.3} className="text-gold" /> Quality checked
            </li>
            <li className="flex flex-col items-center gap-1.5 border-x border-warm-line px-2 py-3.5">
              <RotateCcw size={18} strokeWidth={1.3} className="text-gold" /> 15-day returns
            </li>
            <li className="flex flex-col items-center gap-1.5 px-2 py-3.5">
              <Package size={18} strokeWidth={1.3} className="text-gold" /> Secure packaging
            </li>
          </ul>

          {/* Tabs */}
          <div className="mt-9">
            <div role="tablist" aria-label="Product information" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-warm-line">
              {tabs.map((t) => (
                <button
                  key={t.title}
                  role="tab"
                  id={`tab-${t.title}`}
                  aria-selected={t.title === activeTab.title}
                  aria-controls="product-tabpanel"
                  onClick={() => setTab(t.title)}
                  className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                    t.title === activeTab.title ? "border-espresso text-espresso" : "border-transparent text-muted hover:text-espresso"
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
            <div id="product-tabpanel" role="tabpanel" aria-labelledby={`tab-${activeTab.title}`} className="animate-fade-in pt-5 text-sm leading-relaxed text-espresso/75">
              {activeTab.body}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Care / Shipping & Returns points, edited per product in the admin. */
function Points({ lines }: { lines: string[] }) {
  return (
    <ul className="space-y-2">
      {lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

/**
 * Magnifies the photo under a mouse pointer, following it; the frame's overflow-hidden keeps the
 * enlarged image inside the photo. Mouse only: touch keeps normal scrolling.
 */
function HoverZoom({ scale, children }: { scale: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const aim = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    el.style.transform = `scale(${scale})`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onPointerEnter={aim}
      onPointerMove={aim}
      onPointerLeave={reset}
      className="absolute inset-0 transition-transform duration-300 ease-out [@media(pointer:fine)]:cursor-zoom-in motion-reduce:transition-none"
    >
      {children}
    </div>
  );
}

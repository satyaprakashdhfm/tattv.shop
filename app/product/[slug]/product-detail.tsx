"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, Gift, Heart, Minus, Plus, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { COLLECTIONS, ELEMENTS, TONES, getOption, unitPrice, type Product } from "@/lib/products";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { ProductArt } from "@/components/product-art";
import { useStore } from "@/components/store-provider";

const VIEWS = [
  { view: "front", backdrop: "light" },
  { view: "detail", backdrop: "light" },
  { view: "front", backdrop: "dark" },
  { view: "detail", backdrop: "dark" },
] as const;

function deliveryDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function ProductDetail({ product, initialOptionId }: { product: Product; initialOptionId?: string }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [option, setOption] = useState(() => getOption(product, initialOptionId));
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [viewIndex, setViewIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>("Description");
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);

  const saved = wishlist.includes(product.slug);
  const price = unitPrice(product, option.id);
  const element = ELEMENTS.find((e) => e.id === product.element);
  const collection = COLLECTIONS.find((c) => c.id === product.collection)!;

  const handleAdd = () => {
    if (product.sizes && !size) {
      setSizeError(true);
      return;
    }
    addToCart({ slug: product.slug, optionId: option.id, size: size ?? undefined }, qty);
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
        product.category === "wallets" || option.tone.startsWith("leather") ? (
          <p>Wipe clean with a soft dry cloth. Condition every few months and keep away from direct heat and prolonged moisture to preserve the patina.</p>
        ) : (
          <ul className="space-y-2">
            <li>Store in the TATTV pouch, away from moisture and perfume.</li>
            <li>Polish gently with the included anti-tarnish cloth.</li>
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
    <section className="container-x grid gap-10 py-8 lg:grid-cols-12 lg:gap-14 lg:py-12">
      {/* Gallery */}
      <div className="min-w-0 lg:col-span-7">
        <div className="flex flex-col-reverse gap-4 md:flex-row">
          <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col">
            {VIEWS.map((v, i) => (
              <button
                key={i}
                onClick={() => setViewIndex(i)}
                aria-label={`View image ${i + 1}`}
                className={`aspect-square w-20 shrink-0 overflow-hidden border transition ${viewIndex === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                <ProductArt art={product.art} tone={option.tone} view={v.view} backdrop={v.backdrop} className="h-full w-full" />
              </button>
            ))}
          </div>
          <div className="relative aspect-square flex-1 overflow-hidden bg-sand">
            <ProductArt
              key={`${viewIndex}-${option.id}`}
              art={product.art}
              tone={option.tone}
              view={VIEWS[viewIndex].view}
              backdrop={VIEWS[viewIndex].backdrop}
              className="h-full w-full animate-fade-in"
              title={product.name}
            />
            {product.badge && <span className="absolute left-4 top-4 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.18em]">{product.badge}</span>}
          </div>
        </div>
      </div>

      {/* Buy box */}
      <div className="min-w-0 lg:col-span-5">
        <div className="lg:sticky lg:top-36">
          <p className="eyebrow text-muted">
            {collection.name} Collection{element && ` · ${element.name} (${element.english})`}
          </p>
          <h1 className="display mt-3 text-4xl md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="flex" aria-label={`Rated ${product.rating} out of 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={14} strokeWidth={1.2} className={i < Math.round(product.rating) ? "fill-ink" : ""} />
              ))}
            </span>
            <span className="text-muted">
              {product.rating.toFixed(1)} · {product.reviews} reviews
            </span>
          </div>
          <p className="mt-5 text-xl">
            {formatPrice(price)}
            {product.compareAt && <span className="ml-3 text-base text-muted line-through">{formatPrice(product.compareAt + (option.priceDelta ?? 0))}</span>}
          </p>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
          <p className="mt-6 leading-relaxed text-ink/80">{product.short}</p>

          {/* Material */}
          <div className="mt-8">
            <p className="text-sm">
              <span className="eyebrow">{product.category === "wallets" || option.tone.startsWith("leather") ? "Colour" : "Material"}:</span>{" "}
              <span className="text-muted">{option.label}</span>
            </p>
            <div className="mt-3 flex gap-3">
              {product.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOption(o)}
                  aria-label={o.label}
                  aria-pressed={o.id === option.id}
                  title={`${o.label}${o.priceDelta ? ` (+${formatPrice(o.priceDelta)})` : ""}`}
                  className={`h-9 w-9 rounded-full ring-offset-2 transition ${o.id === option.id ? "ring-1 ring-ink" : "ring-1 ring-line hover:ring-ink/50"}`}
                  style={{ background: TONES[o.tone].swatch }}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          {product.sizes && (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="eyebrow">{product.sizes.label}:</span> <span className="text-muted">{size ?? "Select"}</span>
                </p>
                <Link href="/help#size-guide" className="text-xs underline underline-offset-4">
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
                    className={`h-11 min-w-12 border px-3 text-sm transition ${size === s ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {sizeError && <p className="mt-2 text-sm text-red-700">Please select a {product.sizes.label.toLowerCase()}.</p>}
            </div>
          )}

          {/* Add to bag */}
          <div className="mt-8 flex gap-3">
            <div className="flex h-12 items-center border border-line">
              <button aria-label="Decrease quantity" className="flex h-full w-11 items-center justify-center hover:bg-sand" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button aria-label="Increase quantity" className="flex h-full w-11 items-center justify-center hover:bg-sand" onClick={() => setQty((q) => Math.min(10, q + 1))}>
                <Plus size={14} />
              </button>
            </div>
            <button onClick={handleAdd} className="btn btn-dark flex-1 !px-4">
              Add to Bag<span className="hidden sm:inline"> · {formatPrice(price * qty)}</span>
            </button>
            <button
              onClick={() => toggleWishlist(product.slug)}
              aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={saved}
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-line hover:border-ink"
            >
              <Heart size={18} strokeWidth={1.5} className={saved ? "fill-ink" : ""} />
            </button>
          </div>

          {/* Delivery check */}
          <form
            className="mt-6 flex items-center gap-3 border border-line px-4"
            onSubmit={(e) => {
              e.preventDefault();
              setPinResult(/^\d{6}$/.test(pincode) ? `Delivery by ${deliveryDate(pincode.startsWith("1") || pincode.startsWith("4") || pincode.startsWith("5") || pincode.startsWith("6") ? 2 : 4)}` : "Please enter a valid 6-digit pincode");
            }}
          >
            <Truck size={18} strokeWidth={1.3} className="shrink-0" />
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="Enter pincode for delivery date"
              aria-label="Pincode"
              className="h-12 flex-1 bg-transparent text-sm outline-none"
            />
            <button type="submit" className="text-xs uppercase tracking-[0.16em] underline underline-offset-4">
              Check
            </button>
          </form>
          {pinResult && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Check size={14} /> {pinResult}
            </p>
          )}

          <ul className="mt-8 grid grid-cols-3 gap-3 border-y border-line py-6 text-center text-[11px] uppercase tracking-[0.12em]">
            <li className="flex flex-col items-center gap-2">
              <ShieldCheck size={20} strokeWidth={1.2} /> Hallmarked
            </li>
            <li className="flex flex-col items-center gap-2">
              <RotateCcw size={20} strokeWidth={1.2} /> 15-Day Returns
            </li>
            <li className="flex flex-col items-center gap-2">
              <Gift size={20} strokeWidth={1.2} /> Gift Boxed
            </li>
          </ul>

          {/* Accordions */}
          <div className="divide-y divide-line border-b border-line">
            {panels.map((panel) => (
              <div key={panel.title}>
                <button
                  className="flex w-full items-center justify-between py-5 text-left eyebrow"
                  onClick={() => setOpenPanel(openPanel === panel.title ? null : panel.title)}
                  aria-expanded={openPanel === panel.title}
                >
                  {panel.title}
                  <ChevronDown size={16} className={`transition-transform ${openPanel === panel.title ? "rotate-180" : ""}`} />
                </button>
                {openPanel === panel.title && <div className="animate-fade-in pb-6 text-sm leading-relaxed text-ink/75">{panel.body}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

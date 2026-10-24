"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import {
  CATEGORIES,
  COLLECTIONS,
  MATERIALS,
  PRODUCTS,
  categoryName,
  searchProducts,
  type Product,
} from "@/lib/products";
import { ProductCard } from "@/components/product-card";

const TAGS: Record<string, { title: string; blurb: string; test: (p: Product) => boolean }> = {
  new: { title: "New Arrivals", blurb: "The latest additions to the TATTV collection.", test: (p) => !!p.isNew },
  bestseller: { title: "Bestsellers", blurb: "The pieces our clients return to, again and again.", test: (p) => !!p.bestseller },
};

/** Header backgrounds per page: a photo (with focal point) or, when absent, a strip of product photos. */
const BANNERS: Partial<Record<Product["category"], { src: string; position: string }>> = {
  chains: { src: "/images/shop/chains.jpg", position: "62% 50%" },
  rings: { src: "/images/shop/rings.jpg", position: "50% 42%" },
  bracelets: { src: "/images/shop/bracelets.jpg", position: "62% 50%" },
  wallets: { src: "/images/shop/wallets.jpg", position: "85% 58%" },
};

const PRICES = [
  { id: "u1000", label: "Under ₹1,000", test: (n: number) => n < 1000 },
  { id: "1000-1500", label: "₹1,000 to ₹1,500", test: (n: number) => n >= 1000 && n <= 1500 },
  { id: "1500p", label: "Above ₹1,500", test: (n: number) => n > 1500 },
];

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "new", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function ShopView() {
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get("category") ?? "";
  const collections = list(params.get("collection"));
  const materials = list(params.get("material"));
  const prices = list(params.get("price"));
  const tag = params.get("tag") ?? "";
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "featured";

  // Filters live in the URL so every view is linkable; history.replaceState keeps it client-side.
  const update = (key: string, value: string | string[] | null) => {
    const next = new URLSearchParams(params.toString());
    const v = Array.isArray(value) ? value.join(",") : value;
    if (v) next.set(key, v);
    else next.delete(key);
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `/shop?${qs}` : "/shop");
  };

  const toggle = (key: string, current: string[], id: string) =>
    update(key, current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
  }, [filtersOpen]);

  const results = (() => {
    let items = q ? searchProducts(q) : PRODUCTS;
    if (tag && TAGS[tag]) items = items.filter(TAGS[tag].test);
    if (category) items = items.filter((p) => p.category === category);
    if (collections.length) items = items.filter((p) => collections.includes(p.collection));
    if (materials.length) items = items.filter((p) => materials.includes(p.finish));
    if (prices.length) items = items.filter((p) => PRICES.some((r) => prices.includes(r.id) && r.test(p.price)));
    const sorted = [...items];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "new") sorted.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    return sorted;
  })();

  const heading = q
    ? { title: `“${q}”`, blurb: "Search results" }
    : tag && TAGS[tag]
      ? TAGS[tag]
      : category
        ? { title: categoryName(category as Product["category"]), blurb: CATEGORIES.find((c) => c.id === category)?.blurb ?? "" }
        : collections.length === 1
          ? {
              title: `The ${COLLECTIONS.find((c) => c.id === collections[0])?.name} Collection`,
              blurb: COLLECTIONS.find((c) => c.id === collections[0])?.blurb ?? "",
            }
          : { title: "All Men's Jewellery", blurb: "Chains, pendants, rings, bracelets and fine leather, crafted to be worn every day." };

  const banner = !q && !tag && category ? BANNERS[category as Product["category"]] : undefined;
  // New Arrivals leads with new pieces; other strips show the whole catalogue.
  const stripProducts = [...PRODUCTS].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew)).slice(0, 6);

  const activeChips = [
    ...(tag && TAGS[tag] ? [{ label: TAGS[tag].title, clear: () => update("tag", null) }] : []),
    ...(q ? [{ label: `Search: ${q}`, clear: () => update("q", null) }] : []),
    ...(category ? [{ label: categoryName(category as Product["category"]), clear: () => update("category", null) }] : []),
    ...collections.map((c) => ({ label: COLLECTIONS.find((x) => x.id === c)?.name ?? c, clear: () => toggle("collection", collections, c) })),
    ...materials.map((m) => ({ label: MATERIALS.find((x) => x.id === m)?.name ?? m, clear: () => toggle("material", materials, m) })),
    ...prices.map((p) => ({ label: PRICES.find((x) => x.id === p)?.label ?? p, clear: () => toggle("price", prices, p) })),
  ];

  const filters = (
    <div className="space-y-8">
      <FilterGroup title="Category">
        <Radio label="All Categories" checked={!category} onChange={() => update("category", null)} />
        {CATEGORIES.map((c) => (
          <Radio key={c.id} label={c.name} checked={category === c.id} onChange={() => update("category", c.id)} count={PRODUCTS.filter((p) => p.category === c.id).length} />
        ))}
      </FilterGroup>
      <FilterGroup title="Material">
        {MATERIALS.map((m) => (
          <Checkbox key={m.id} label={m.name} checked={materials.includes(m.id)} onChange={() => toggle("material", materials, m.id)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        {PRICES.map((p) => (
          <Checkbox key={p.id} label={p.label} checked={prices.includes(p.id)} onChange={() => toggle("price", prices, p.id)} />
        ))}
      </FilterGroup>
    </div>
  );

  return (
    <>
      <section className="relative isolate flex h-[240px] items-center overflow-hidden bg-ink text-white md:h-[320px]">
        {banner ? (
          <>
            <Image src={banner.src} alt="" fill priority sizes="100vw" className="-z-20 object-cover" style={{ objectPosition: banner.position }} />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/45 to-black/5" />
          </>
        ) : (
          <>
            {/* Strip of product photos (New Arrivals, all jewellery, search) */}
            <div className="absolute inset-0 -z-20 grid grid-cols-3 md:grid-cols-6">
              {stripProducts.map((p) => (
                <div key={p.slug} className="relative">
                  <Image src={p.images[0]} alt="" fill priority sizes="(min-width: 768px) 17vw, 34vw" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
          </>
        )}
        <div className="container-x">
          <nav className="mb-4 text-xs text-white/70" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Shop</span>
          </nav>
          <h1 className="title text-2xl md:text-3xl">{heading.title}</h1>
          {heading.blurb && <p className="mt-3 max-w-md text-white/80">{heading.blurb}</p>}
        </div>
      </section>

      <div className="container-x py-10 md:py-14">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-center gap-6">
            <button onClick={() => setFiltersOpen(true)} className="eyebrow flex items-center gap-2 lg:hidden">
              <SlidersHorizontal size={16} strokeWidth={1.5} /> Filter
            </button>
            <p className="text-sm text-muted">
              {results.length} {results.length === 1 ? "piece" : "pieces"}
            </p>
          </div>
          <label className="relative flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">Sort by</span>
            <select value={sort} onChange={(e) => update("sort", e.target.value === "featured" ? null : e.target.value)} className="appearance-none bg-transparent pr-6 font-medium outline-none">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-0" />
          </label>
        </div>

        {activeChips.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button key={chip.label} onClick={chip.clear} className="flex items-center gap-2 bg-sand px-3 py-1.5 text-xs hover:bg-sand-dark">
                {chip.label} <X size={12} />
              </button>
            ))}
            <button onClick={() => window.history.replaceState(null, "", "/shop")} className="ml-2 text-xs underline underline-offset-4">
              Clear all
            </button>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[220px_1fr] xl:gap-14">
          <aside className="hidden lg:block">{filters}</aside>
          {results.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
              {results.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="title text-base md:text-lg">No pieces found</p>
              <p className="mt-3 text-muted">Try removing a filter or two.</p>
              <button onClick={() => window.history.replaceState(null, "", "/shop")} className="btn btn-dark mt-8">
                View All Jewellery
              </button>
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-slide-in-left flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <p className="eyebrow">Filter</p>
              <button aria-label="Close filters" onClick={() => setFiltersOpen(false)}>
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filters}</div>
            <div className="border-t border-line p-5">
              <button onClick={() => setFiltersOpen(false)} className="btn btn-dark w-full">
                Show {results.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-4">{title}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="flex h-4 w-4 items-center justify-center border border-ink/40 peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-1 peer-focus-visible:ring-ink">
        {checked && <span className="h-1.5 w-1.5 bg-white" />}
      </span>
      {label}
    </label>
  );
}

function Radio({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="radio" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-ink/40 peer-checked:border-ink peer-focus-visible:ring-1 peer-focus-visible:ring-ink">
        {checked && <span className="h-2 w-2 rounded-full bg-ink" />}
      </span>
      <span className={checked ? "font-medium" : ""}>{label}</span>
      {count !== undefined && <span className="ml-auto text-xs text-muted">{count}</span>}
    </label>
  );
}

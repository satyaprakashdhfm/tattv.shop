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
  categoryTitle,
  searchProducts,
  type Product,
} from "@/lib/products";
import { ProductCard } from "@/components/product-card";

const TAGS: Record<string, { title: string; blurb: string; test: (p: Product) => boolean }> = {
  new: { title: "New Arrivals", blurb: "The latest additions to the TATTV collection.", test: (p) => !!p.isNew },
  bestseller: { title: "Bestsellers", blurb: "The pieces our clients return to, again and again.", test: (p) => !!p.bestseller },
};

/**
 * Header photo per page, shown unfiltered. `tone` is the brightness behind the title:
 * dark photos get white copy with a soft shadow, light ones get ink copy.
 */
interface Banner {
  src: string;
  position: string;
  tone: "dark" | "light";
  /** Side of the banner the copy sits on: the photo's empty side. Defaults to left. */
  align?: "left" | "right";
}

const BANNERS: Partial<Record<Product["category"], Banner>> = {
  chains: { src: "/images/shop/chains.jpg", position: "75% 60%", tone: "light" },
  rings: { src: "/images/shop/rings.jpg", position: "85% 55%", tone: "light" },
  bracelets: { src: "/images/shop/bracelets.jpg", position: "0% 55%", tone: "light", align: "right" },
  wallets: { src: "/images/shop/wallets.jpg", position: "85% 58%", tone: "dark" },
  earrings: { src: "/images/shop/earrings.jpg", position: "15% 55%", tone: "dark", align: "right" },
};

const NEW_ARRIVALS_BANNER: Banner = { src: "/images/shop/new.jpg", position: "100% 55%", tone: "dark" };
const ALL_BANNER: Banner = { src: "/images/shop/all.jpg", position: "80% 35%", tone: "light" };

const PRICES = [
  { id: "u1000", label: "Under ₹1,000", test: (n: number) => n < 1000 },
  { id: "1000-1500", label: "₹1,000 to ₹1,500", test: (n: number) => n >= 1000 && n <= 1500 },
  { id: "1500p", label: "Above ₹1,500", test: (n: number) => n > 1500 },
];

const AVAILABILITY = [
  { id: "in", label: "In stock", test: (p: Product) => !p.soldOut },
  { id: "out", label: "Out of stock", test: (p: Product) => !!p.soldOut },
];

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "new", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

/** Products shown per batch: three full rows of the three-column grid. */
const PAGE_SIZE = 9;

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function ShopView() {
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  // How many products are revealed; resets to one batch whenever the filters/sort (the URL) change.
  const viewKey = params.toString();
  const [reveal, setReveal] = useState({ key: viewKey, count: PAGE_SIZE });
  const visibleCount = reveal.key === viewKey ? reveal.count : PAGE_SIZE;

  const category = params.get("category") ?? "";
  const collections = list(params.get("collection"));
  const materials = list(params.get("material"));
  const prices = list(params.get("price"));
  const stock = list(params.get("stock"));
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

  // The page's own scope (search / New Arrivals / Bestsellers); filter counts are taken from it.
  const scope = (() => {
    const items = q ? searchProducts(q) : PRODUCTS;
    return tag && TAGS[tag] ? items.filter(TAGS[tag].test) : items;
  })();

  const results = (() => {
    let items = scope;
    if (category) items = items.filter((p) => p.category === category);
    if (collections.length) items = items.filter((p) => collections.includes(p.collection));
    if (materials.length) items = items.filter((p) => materials.includes(p.finish));
    if (prices.length) items = items.filter((p) => PRICES.some((r) => prices.includes(r.id) && r.test(p.price)));
    if (stock.length) items = items.filter((p) => AVAILABILITY.some((a) => stock.includes(a.id) && a.test(p)));
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
        ? { title: categoryTitle(category as Product["category"]), blurb: CATEGORIES.find((c) => c.id === category)?.blurb ?? "" }
        : collections.length === 1
          ? {
              title: `The ${COLLECTIONS.find((c) => c.id === collections[0])?.name} Collection`,
              blurb: COLLECTIONS.find((c) => c.id === collections[0])?.blurb ?? "",
            }
          : { title: "All Men's Jewellery", blurb: "Chains, pendants, rings, bracelets and fine leather, crafted to be worn every day." };

  const banner = (tag === "new" ? NEW_ARRIVALS_BANNER : !q && !tag && category ? BANNERS[category as Product["category"]] : undefined) ?? ALL_BANNER;
  const light = banner.tone === "light";

  const activeChips = [
    ...(tag && TAGS[tag] ? [{ label: TAGS[tag].title, clear: () => update("tag", null) }] : []),
    ...(q ? [{ label: `Search: ${q}`, clear: () => update("q", null) }] : []),
    ...(category ? [{ label: categoryName(category as Product["category"]), clear: () => update("category", null) }] : []),
    ...collections.map((c) => ({ label: COLLECTIONS.find((x) => x.id === c)?.name ?? c, clear: () => toggle("collection", collections, c) })),
    ...materials.map((m) => ({ label: MATERIALS.find((x) => x.id === m)?.name ?? m, clear: () => toggle("material", materials, m) })),
    ...prices.map((p) => ({ label: PRICES.find((x) => x.id === p)?.label ?? p, clear: () => toggle("price", prices, p) })),
    ...stock.map((s) => ({ label: AVAILABILITY.find((x) => x.id === s)?.label ?? s, clear: () => toggle("stock", stock, s) })),
  ];

  // "Clear all" keeps the page itself (search / New Arrivals) and drops only the sidebar filters.
  const sidebarActive = !!category || materials.length + prices.length + stock.length + collections.length > 0;
  const clearFilters = () => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (tag) next.set("tag", tag);
    if (sort !== "featured") next.set("sort", sort);
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `/shop?${qs}` : "/shop");
  };

  const filters = (
    <div>
      <div className="hidden items-center justify-between pb-4 lg:flex">
        <p className="text-sm font-semibold">Filters</p>
        {sidebarActive && (
          <button onClick={clearFilters} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
            Clear all
          </button>
        )}
      </div>
      <div className="divide-y divide-line border-t border-line">
        <FilterGroup title="Category">
          <Radio label="All Categories" checked={!category} onChange={() => update("category", null)} />
          {CATEGORIES.map((c) => (
            <Radio key={c.id} label={c.name} checked={category === c.id} onChange={() => update("category", c.id)} count={scope.filter((p) => p.category === c.id).length} />
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
        <FilterGroup title="Availability">
          {AVAILABILITY.map((a) => (
            <Checkbox key={a.id} label={a.label} checked={stock.includes(a.id)} onChange={() => toggle("stock", stock, a.id)} count={scope.filter(a.test).length} />
          ))}
        </FilterGroup>
      </div>
    </div>
  );

  return (
    <>
      {/* Photo shown as-is (no overlay). From md up the copy sits on the photo's empty side;
          on phones it stacks under the photo so it never covers the jewellery. */}
      <section
        className={`relative isolate overflow-hidden md:flex md:h-[clamp(320px,23vw,460px)] md:items-center ${
          light ? "bg-sand text-ink" : "bg-ink text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55),0_2px_16px_rgba(0,0,0,0.45)]"
        }`}
      >
        <div className="relative aspect-[8/3] md:absolute md:inset-0 md:aspect-auto">
          <Image src={banner.src} alt="" fill priority sizes="100vw" className="object-cover" style={{ objectPosition: banner.position }} />
        </div>
        <div className={`container-x relative py-6 md:py-0 ${banner.align === "right" ? "md:flex md:flex-col md:items-end md:text-right" : ""}`}>
          <nav className={`mb-4 text-xs ${light ? "text-ink/70" : "text-white/85"}`} aria-label="Breadcrumb">
            <Link href="/" className={light ? "hover:text-ink" : "hover:text-white"}>
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className={light ? "text-ink" : "text-white"}>Shop</span>
          </nav>
          <h1 className="title text-2xl md:text-3xl">{heading.title}</h1>
          {heading.blurb && <p className={`mt-3 max-w-md ${light ? "text-ink/80" : "text-white/90"}`}>{heading.blurb}</p>}
        </div>
      </section>

      <div className="container-x py-10 md:py-14">
        <div className="grid items-start gap-10 lg:grid-cols-[230px_1fr] xl:gap-12">
          <aside className="hidden lg:sticky lg:top-24 lg:block">{filters}</aside>
          <div className="min-w-0">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setFiltersOpen(true)} className="mr-2 flex items-center gap-2 border border-line bg-white px-3 py-1.5 text-xs font-medium lg:hidden">
                  <SlidersHorizontal size={14} strokeWidth={1.5} /> Filters
                </button>
                <p className="mr-2 text-sm text-muted">
                  {results.length} {results.length === 1 ? "product" : "products"}
                </p>
                {activeChips.map((chip) => (
                  <button key={chip.label} onClick={chip.clear} className="flex items-center gap-1.5 rounded-full bg-sand-dark px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-[#d9d3c9]" aria-label={`Remove ${chip.label}`}>
                    {chip.label} <X size={12} />
                  </button>
                ))}
              </div>
              <label className="relative flex shrink-0 items-center gap-2 text-sm">
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

            {results.length ? (
              <div>
                <div className="grid grid-cols-2 content-start gap-3 md:grid-cols-3 md:gap-5">
                  {results.slice(0, visibleCount).map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>
                {results.length > PAGE_SIZE && (
                  <div className="mx-auto mt-12 flex max-w-xs flex-col items-center text-center">
                    <p className="text-sm text-muted" aria-live="polite">
                      Showing {Math.min(visibleCount, results.length)} of {results.length} pieces
                    </p>
                    <div className="mt-3 h-0.5 w-full bg-line">
                      <div className="h-full bg-ink transition-all duration-500" style={{ width: `${(Math.min(visibleCount, results.length) / results.length) * 100}%` }} />
                    </div>
                    {visibleCount < results.length && (
                      <button onClick={() => setReveal({ key: viewKey, count: visibleCount + PAGE_SIZE })} className="btn btn-outline mt-6 w-full">
                        Load More
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="title text-base md:text-lg">No pieces found</p>
                <p className="mt-3 text-muted">Try removing a filter or two.</p>
                <button onClick={clearFilters} className="btn btn-dark mt-8">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-slide-in-left flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <p className="text-sm font-semibold">Filters</p>
              <div className="flex items-center gap-5">
                {sidebarActive && (
                  <button onClick={clearFilters} className="text-xs text-muted underline underline-offset-4">
                    Clear all
                  </button>
                )}
                <button aria-label="Close filters" onClick={() => setFiltersOpen(false)}>
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>
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
  const [open, setOpen] = useState(true);
  return (
    <fieldset className="py-4">
      <legend className="contents">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em]"
        >
          {title}
          <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </legend>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </fieldset>
  );
}

function Checkbox({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="flex h-4 w-4 items-center justify-center border border-ink/40 peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-1 peer-focus-visible:ring-ink">
        {checked && <span className="h-1.5 w-1.5 bg-white" />}
      </span>
      <span className={checked ? "font-medium" : ""}>{label}</span>
      {count !== undefined && <span className="ml-auto text-xs text-muted">{count}</span>}
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

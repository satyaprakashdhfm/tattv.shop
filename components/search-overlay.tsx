"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCatalog, useStore } from "./store-provider";
import { ProductImage } from "./product-image";

const POPULAR = ["Pendant", "Bangle", "Ring", "Wallet", "Leather", "Steel"];

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const catalog = useCatalog();
  const results = useMemo(() => catalog.search(query), [catalog, query]);

  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const close = () => setSearchOpen(false);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={close} />
      <div className="relative max-h-[90vh] animate-slide-down overflow-y-auto rounded-b-[2rem] bg-white shadow-lift">
        <div className="container-x py-6 md:py-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!query.trim()) return;
              close();
              router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
            }}
            className="flex items-center gap-4 border-b border-ink pb-3"
          >
            <Search size={22} strokeWidth={1.5} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chains, rings, bracelets, wallets…"
              className="flex-1 bg-transparent font-serif text-2xl outline-none placeholder:text-muted/60 md:text-3xl"
              aria-label="Search products"
            />
            <button type="button" aria-label="Close search" onClick={close}>
              <X size={24} strokeWidth={1.5} />
            </button>
          </form>

          {!query.trim() ? (
            <div className="mt-8">
              <p className="eyebrow mb-4 text-muted">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button key={term} onClick={() => setQuery(term)} className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-ink">
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <div className="mb-5 flex items-center justify-between">
                <p className="eyebrow text-muted">
                  {results.length} {results.length === 1 ? "Result" : "Results"}
                </p>
                {results.length > 0 && (
                  <Link href={`/shop?q=${encodeURIComponent(query.trim())}`} onClick={close} className="eyebrow flex items-center gap-2 hover:opacity-60">
                    View all <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              {results.length === 0 ? (
                <p className="text-muted">No pieces match “{query}”. Try a different term.</p>
              ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                  {results.slice(0, 6).map((p) => (
                    <Link key={p.slug} href={`/product/${p.slug}`} onClick={close} className="group">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand">
                        <ProductImage product={p} sizes="(min-width: 1024px) 16vw, 50vw" />
                      </div>
                      <p className="mt-2 text-sm font-medium leading-tight group-hover:underline">{p.name}</p>
                      <p className="text-xs text-muted">{formatPrice(p.price)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

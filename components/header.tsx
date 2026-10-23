"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { NAV } from "@/lib/navigation";
import { getProduct } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { useStore } from "./store-provider";
import { ProductImage } from "./product-image";

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-medium text-white">
      {count}
    </span>
  );
}

function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(onNavigate, [pathname, params, onNavigate]);
  return null;
}

export function Header() {
  const { cartCount, wishlist, setCartOpen, setSearchOpen } = useStore();
  const [active, setActive] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const closeAll = useCallback(() => {
    setActive(null);
    setMobileOpen(false);
  }, []);

  const panel = active !== null ? NAV[active] : null;

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur transition-shadow ${scrolled ? "shadow-[0_1px_0_var(--color-line)]" : "border-b border-line"}`}
      onMouseLeave={() => setActive(null)}
    >
      <Suspense fallback={null}>
        <CloseOnNavigate onNavigate={closeAll} />
      </Suspense>

      {/* Equal side columns keep the nav at the true centre of the bar. */}
      <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-20">
        <div className="flex items-center gap-4">
          <button aria-label="Open menu" className="-ml-1 p-1 xl:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={22} strokeWidth={1.5} />
          </button>

          <Link href="/" aria-label="TATTV home" className="shrink-0">
            <Image
              src="/brand/logo-black.png"
              alt="TATTV · Energize Your Style Element"
              width={1147}
              height={294}
              priority
              className={`h-auto transition-all duration-300 ${scrolled ? "w-[118px] md:w-[136px]" : "w-[124px] md:w-[150px]"}`}
            />
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden h-full xl:block" aria-label="Main">
          <ul className="flex h-full items-center justify-center gap-7 2xl:gap-10">
            {NAV.map((item, i) => (
              <li key={item.label} className="flex h-full items-center" onMouseEnter={() => setActive(item.columns ? i : null)}>
                <Link
                  href={item.href}
                  className={`relative whitespace-nowrap py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-ink after:transition-transform ${
                    active === i ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-start-3 flex items-center justify-end gap-5" onMouseEnter={() => setActive(null)}>
          <button aria-label="Search" onClick={() => setSearchOpen(true)} className="hover:opacity-60">
            <Search size={20} strokeWidth={1.5} />
          </button>
          <Link href="/account" aria-label="Account" className="hidden hover:opacity-60 sm:block">
            <User size={20} strokeWidth={1.5} />
          </Link>
          <Link href="/wishlist" aria-label="Wishlist" className="relative hover:opacity-60">
            <Heart size={20} strokeWidth={1.5} />
            <Badge count={wishlist.length} />
          </Link>
          <button aria-label="Shopping bag" onClick={() => setCartOpen(true)} className="relative hover:opacity-60">
            <ShoppingBag size={20} strokeWidth={1.5} />
            <Badge count={cartCount} />
          </button>
        </div>
      </div>

      {/* Mega menu */}
      {panel?.columns && (
        <div className="absolute inset-x-0 top-full hidden animate-slide-down border-t border-line bg-white shadow-[0_24px_40px_-24px_rgba(0,0,0,.25)] xl:block">
          <div className="container-x grid grid-cols-12 gap-10 py-10">
            {panel.columns.map((col) => (
              <div key={col.title} className="col-span-2">
                <p className="eyebrow mb-5 text-muted">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="link-underline text-[15px]">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-6 col-start-7 grid grid-cols-2 gap-6">
              {panel.featured?.map((slug) => {
                const p = getProduct(slug);
                if (!p) return null;
                return (
                  <Link key={slug} href={`/product/${p.slug}`} className="group">
                    <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                      <ProductImage product={p} sizes="25vw" className="transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <p className="mt-3 text-[15px] font-medium">{p.name}</p>
                    <p className="text-sm text-muted">{formatPrice(p.price)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-slide-in-left flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Image src="/brand/logo-black.png" alt="TATTV" width={1147} height={294} className="h-auto w-[120px]" />
              <button aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto px-5 py-4">
              {NAV.map((item, i) => (
                <li key={item.label} className="border-b border-line">
                  {item.columns ? (
                    <>
                      <button
                        className="flex w-full items-center justify-between py-4 text-left eyebrow"
                        onClick={() => setExpanded(expanded === i ? null : i)}
                        aria-expanded={expanded === i}
                      >
                        {item.label}
                        <ChevronDown size={16} className={`transition-transform ${expanded === i ? "rotate-180" : ""}`} />
                      </button>
                      {expanded === i && (
                        <div className="space-y-5 pb-5">
                          {item.columns.map((col) => (
                            <div key={col.title}>
                              <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-muted">{col.title}</p>
                              <ul className="space-y-2">
                                {col.links.map((l) => (
                                  <li key={l.label}>
                                    <Link href={l.href} className="text-[15px]">
                                      {l.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} className="block py-4 eyebrow">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-5 text-sm">
              <Link href="/account" className="flex items-center gap-3">
                <User size={18} strokeWidth={1.5} /> Sign in / Register
              </Link>
              <Link href="/wishlist" className="flex items-center gap-3">
                <Heart size={18} strokeWidth={1.5} /> Wishlist ({wishlist.length})
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

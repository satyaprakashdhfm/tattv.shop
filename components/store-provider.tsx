"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProduct } from "@/lib/products";

export interface CartLine {
  key: string;
  slug: string;
  size?: string;
  qty: number;
}

interface StoreValue {
  cart: CartLine[];
  cartCount: number;
  subtotal: number;
  addToCart: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const CART_KEY = "tattv.cart.v2";
const WISHLIST_KEY = "tattv.wishlist";

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the session still works in memory.
  }
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setCart(readStorage<CartLine[]>(CART_KEY, []).filter((l) => getProduct(l.slug)));
    setWishlist(readStorage<string[]>(WISHLIST_KEY, []).filter((s) => getProduct(s)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(CART_KEY, cart);
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(WISHLIST_KEY, wishlist);
  }, [wishlist, hydrated]);

  const addToCart = useCallback((line: Omit<CartLine, "key" | "qty">, qty = 1) => {
    const key = [line.slug, line.size ?? ""].join("|");
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(10, l.qty + qty) } : l));
      return [...prev, { ...line, key, qty }];
    });
    setCartOpen(true);
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setCart((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(10, qty) } : l))));
  }, []);

  const removeLine = useCallback((key: string) => setCart((prev) => prev.filter((l) => l.key !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const value = useMemo<StoreValue>(() => {
    const cartCount = cart.reduce((n, l) => n + l.qty, 0);
    const subtotal = cart.reduce((sum, l) => {
      const product = getProduct(l.slug);
      return product ? sum + product.price * l.qty : sum;
    }, 0);
    return {
      cart,
      cartCount,
      subtotal,
      addToCart,
      updateQty,
      removeLine,
      clearCart,
      wishlist,
      toggleWishlist,
      cartOpen,
      setCartOpen,
      searchOpen,
      setSearchOpen,
    };
  }, [cart, wishlist, cartOpen, searchOpen, addToCart, updateQty, removeLine, clearCart, toggleWishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

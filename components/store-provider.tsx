"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { makeCatalog, type Catalog, type CatalogData } from "@/lib/catalog";
import { MAX_QTY_PER_ITEM } from "@/lib/site";
import { DEMO_CREDENTIALS, DEMO_WISHLIST, checkDemoCredentials, type Account } from "@/lib/demo-account";

export interface CartLine {
  key: string;
  slug: string;
  size?: string;
  qty: number;
}

interface StoreValue {
  /** Products, categories and settings from the database (edited in the admin). */
  catalog: Catalog;
  cart: CartLine[];
  cartCount: number;
  subtotal: number;
  /** Adds to the bag and opens the bag drawer (pass `{ open: false }` to stay put, e.g. on checkout). */
  addToCart: (line: Omit<CartLine, "key" | "qty">, qty?: number, opts?: { open?: boolean }) => void;
  /** Most a line for this piece can hold: the per-item cap or what's left in stock. */
  limitFor: (slug: string) => number;
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  /** False until the saved bag has been read from this device. */
  cartReady: boolean;
  /** Signed-in customer: a mobile-number account (server session), or the browser-only preview account. */
  account: Account | null;
  /** False until the saved session has been read, so pages don't flash the signed-out view. */
  sessionReady: boolean;
  /** The browser-only preview account (shown only while mobile login isn't set up). */
  signIn: (email: string, password: string) => boolean;
  /** After a mobile login code is checked on the server. */
  setSignedIn: (account: Account) => void;
  signOut: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const CART_KEY = "tattv.cart.v2";
const WISHLIST_KEY = "tattv.wishlist";
const SESSION_KEY = "tattv.session";

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

export function StoreProvider({ catalogData, children }: { catalogData: CatalogData; children: ReactNode }) {
  const catalog = useMemo(() => makeCatalog(catalogData), [catalogData]);
  const { getProduct } = catalog;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setCart(readStorage<CartLine[]>(CART_KEY, []).filter((l) => getProduct(l.slug)));
    const saved = readStorage<Account | null>(SESSION_KEY, null);
    // The preview account starts with a few saved pieces, until the visitor changes the wishlist.
    const previewDefault = saved?.email === DEMO_CREDENTIALS.email ? DEMO_WISHLIST : [];
    setWishlist(readStorage<string[] | null>(WISHLIST_KEY, null) ?? previewDefault.filter((s) => getProduct(s)));
    setAccount(saved);
    setHydrated(true);
    // A mobile-number session (a signed cookie) wins over the preview account.
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { customer?: Account | null }) => {
        if (d.customer) setAccount(d.customer);
      })
      .catch(() => {})
      .finally(() => setSessionReady(true));
  }, [getProduct]);

  const setSignedIn = useCallback((a: Account) => {
    setAccount(a);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing saved to clear.
    }
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const found = checkDemoCredentials(email, password);
    if (found) {
      setAccount(found);
      writeStorage(SESSION_KEY, found);
      setWishlist((w) => (w.length ? w : DEMO_WISHLIST.filter((s) => getProduct(s))));
    }
    return !!found;
  }, [getProduct]);

  const signOut = useCallback(() => {
    setAccount(null);
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage unavailable: the in-memory sign-out above is enough.
    }
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(CART_KEY, cart);
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(WISHLIST_KEY, wishlist);
  }, [wishlist, hydrated]);

  const limitFor = useCallback(
    (slug: string) => {
      const left = getProduct(slug)?.stock;
      return left == null ? MAX_QTY_PER_ITEM : Math.min(MAX_QTY_PER_ITEM, left);
    },
    [getProduct],
  );

  // Stock is counted per piece across sizes, so a line can only grow into what the other sizes leave.
  const room = (lines: CartLine[], slug: string, exceptKey?: string) =>
    limitFor(slug) - lines.filter((l) => l.slug === slug && l.key !== exceptKey).reduce((n, l) => n + l.qty, 0);

  const addToCart = useCallback(
    (line: Omit<CartLine, "key" | "qty">, qty = 1, opts?: { open?: boolean }) => {
      const key = [line.slug, line.size ?? ""].join("|");
      setCart((prev) => {
        const existing = prev.find((l) => l.key === key);
        const next = Math.min((existing?.qty ?? 0) + qty, room(prev, line.slug, key));
        if (next <= 0) return prev;
        if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: next } : l));
        return [...prev, { ...line, key, qty: next }];
      });
      // Phones don't jump into the bag; the floating Checkout bar at the bottom takes them there when they choose.
      if (opts?.open !== false && !window.matchMedia("(max-width: 767px)").matches) setCartOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- room only reads limitFor
    [limitFor],
  );

  const updateQty = useCallback(
    (key: string, qty: number) => {
      setCart((prev) => {
        if (qty <= 0) return prev.filter((l) => l.key !== key);
        return prev.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(qty, room(prev, l.slug, key))) } : l));
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- room only reads limitFor
    [limitFor],
  );

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
      catalog,
      cart,
      cartCount,
      subtotal,
      addToCart,
      limitFor,
      updateQty,
      removeLine,
      clearCart,
      wishlist,
      toggleWishlist,
      cartOpen,
      setCartOpen,
      searchOpen,
      setSearchOpen,
      cartReady: hydrated,
      account,
      sessionReady,
      signIn,
      setSignedIn,
      signOut,
    };
  }, [catalog, getProduct, cart, wishlist, cartOpen, searchOpen, account, hydrated, sessionReady, addToCart, limitFor, updateQty, removeLine, clearCart, toggleWishlist, signIn, setSignedIn, signOut]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCatalog() {
  return useStore().catalog;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

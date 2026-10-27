"use client";

// Browser helpers: JSON calls to our API routes, and orders placed on this device.

export async function api<T = Record<string, unknown>>(path: string, { method = "GET", body }: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong"), { status: res.status });
  return data as T;
}

const ORDERS_KEY = "tattv.orders";

export interface SavedOrder {
  id: string;
  token: string;
  at: number;
}

/** Orders placed on this device, so guests can reopen their order pages. */
export function myOrders(): SavedOrder[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function rememberOrder(id: string, token: string) {
  try {
    const list = myOrders().filter((o) => o.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify([{ id, token, at: Date.now() }, ...list].slice(0, 30)));
  } catch {
    // Storage unavailable: the order link still works.
  }
}

export const orderToken = (id: string) => myOrders().find((o) => o.id === id)?.token ?? null;

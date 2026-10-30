import "server-only";
import { NextResponse } from "next/server";
import { OrderError } from "@/lib/pricing";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler: known errors become { error } with their status; anything else is logged and returned as a generic 500. */
export function handler<C>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new OrderError("Invalid request");
  }
}

export const json = NextResponse.json;

// In-memory limit per client address: at most `max` calls per `minutes` for each `key` (enough to stop code guessing).
const hits = new Map<string, number[]>();
export function rateLimit(req: Request, key: string, max: number, minutes: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const id = `${key}|${ip}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < minutes * 60_000);
  if (recent.length >= max) throw new OrderError("Too many tries. Please wait a few minutes and try again.", 429);
  recent.push(now);
  hits.set(id, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value!);
}

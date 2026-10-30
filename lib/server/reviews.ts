import "server-only";
import crypto from "node:crypto";
import { OrderError } from "@/lib/pricing";
import type { Review } from "@/lib/reviews";
import { query } from "./db";
import { accountOrders, getOrderFor } from "./orders";

// Customer reviews: once an order is delivered, its page asks for a star rating (1 to 5) and a few
// words. One per order. Each waits in Admin → Reviews; only the ones the admin publishes show on the
// home page. Reviews from real, delivered orders are marked Verified. The admin can also write reviews
// (source "admin") and edit any review; the starting samples have source "sample".

export type ReviewStatus = "pending" | "published" | "hidden";

export type ReviewSource = "order" | "admin" | "sample";

export interface StoredReview {
  id: string;
  orderId: string | null;
  source: ReviewSource;
  createdAt: string;
  rating: number;
  title: string;
  body: string;
  name: string;
  city: string;
  status: ReviewStatus;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- raw rows */
const toReview = (r: any): StoredReview => ({
  id: r.id,
  orderId: r.order_id,
  source: r.source,
  createdAt: new Date(r.created_at).toISOString(),
  rating: r.rating,
  title: r.title,
  body: r.body,
  name: r.name,
  city: r.city,
  status: r.status,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The review left on an order, if any (for the customer's order page). */
export async function reviewForOrder(orderId: string) {
  const r = await query("SELECT * FROM reviews WHERE order_id = $1", [orderId]);
  return r.rows[0] ? toReview(r.rows[0]) : null;
}

/** Saves the customer's rating for a delivered order; only the customer (with the order's link) can. */
export async function submitReview(orderId: string, token: string | null, input: { rating?: unknown; title?: unknown; body?: unknown }) {
  const o = await getOrderFor(orderId, token);
  if (!o) throw new OrderError("Order not found", 404);
  if (o.status !== "delivered") throw new OrderError("You can rate your order once it has been delivered.");
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new OrderError("Choose from 1 to 5 stars.");
  const title = String(input.title ?? "").trim().slice(0, 80);
  const body = String(input.body ?? "").trim().slice(0, 1000);
  // "Rahul S.", "Hyderabad": how the review is signed if it's published.
  const name = [o.customer.firstName.trim(), o.customer.lastName.trim().charAt(0)].filter(Boolean).join(" ") + (o.customer.lastName.trim() ? "." : "");
  const r = await query(
    `INSERT INTO reviews (id, order_id, rating, title, body, name, city) VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (order_id) DO NOTHING RETURNING *`,
    ["rev_" + crypto.randomBytes(6).toString("hex"), o.id, rating, title, body, name.slice(0, 60), o.customer.city.slice(0, 60)],
  );
  if (!r.rowCount) throw new OrderError("You have already rated this order. Thank you!", 409);
  return toReview(r.rows[0]);
}

/**
 * The newest delivered order without a review among the visitor's orders (those saved in this browser,
 * proven by their tokens, and the signed-in customer's), for the "Rate your order" pop-up.
 */
export async function orderAwaitingReview(refs: unknown, phone: string | null) {
  const orders = (await accountOrders(refs, { email: null, phone })).filter((o) => o.status === "delivered");
  if (!orders.length) return null;
  const done = await query<{ order_id: string }>("SELECT order_id FROM reviews WHERE order_id = ANY($1)", [orders.map((o) => o.id)]);
  const rated = new Set(done.rows.map((r) => r.order_id));
  const o = orders.find((x) => !rated.has(x.id));
  return o ? { id: o.id, token: o.token, firstName: o.customer.firstName, name: o.lines[0]?.name ?? "", image: o.lines[0]?.image ?? "", more: o.lines.length - 1 } : null;
}

/** Admin → Reviews: newest first. */
export async function listReviews(): Promise<StoredReview[]> {
  const r = await query("SELECT * FROM reviews ORDER BY created_at DESC");
  return r.rows.map(toReview);
}

export async function setReviewStatus(id: string, status: string) {
  if (!["pending", "published", "hidden"].includes(status)) throw new OrderError("Unknown status");
  await query("UPDATE reviews SET status = $2 WHERE id = $1", [id, status]);
}

export async function deleteReview(id: string) {
  await query("DELETE FROM reviews WHERE id = $1", [id]);
}

/** What the home page shows: published reviews, newest first. */
export async function publishedReviews(): Promise<Review[]> {
  const r = await query("SELECT * FROM reviews WHERE status = 'published' ORDER BY created_at DESC LIMIT 30");
  return r.rows.map(toReview).map((x) => ({
    title: x.title || (x.rating >= 4 ? "Loved it" : "My order"),
    quote: x.body,
    name: x.name || "TATTV customer",
    city: x.city,
    rating: x.rating,
    verified: x.source === "order",
  }));
}

/** Admin → Reviews: edit a review, or write a new one (no `id`). */
export async function saveReview(input: { id?: unknown; rating?: unknown; title?: unknown; body?: unknown; name?: unknown; city?: unknown; status?: unknown }) {
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new OrderError("Choose from 1 to 5 stars.");
  const t = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const status = ["pending", "published", "hidden"].includes(String(input.status)) ? String(input.status) : "published";
  const name = t(input.name, 60);
  if (!name) throw new OrderError("Add the customer's name as it should show, e.g. Rahul S.");
  const values = [rating, t(input.title, 80), t(input.body, 1000), name, t(input.city, 60), status];
  const id = t(input.id, 40);
  if (id) {
    const r = await query("UPDATE reviews SET rating=$2, title=$3, body=$4, name=$5, city=$6, status=$7 WHERE id=$1", [id, ...values]);
    if (!r.rowCount) throw new OrderError("That review no longer exists.", 404);
  } else {
    await query("INSERT INTO reviews (id, order_id, rating, title, body, name, city, status, source) VALUES ($1, NULL, $2,$3,$4,$5,$6,$7, 'admin')", [
      "rev_" + crypto.randomBytes(6).toString("hex"),
      ...values,
    ]);
  }
}

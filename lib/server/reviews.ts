import "server-only";
import crypto from "node:crypto";
import { OrderError } from "@/lib/pricing";
import type { Review } from "@/lib/reviews";
import { query } from "./db";
import { getOrderFor } from "./orders";

// Customer reviews: once an order is delivered, its page asks for a star rating (1 to 5) and a few
// words. One per order. Each waits in Admin → Reviews; only the ones the admin publishes show on the
// home page, marked Verified (they come from a real, delivered order).

export type ReviewStatus = "pending" | "published" | "hidden";

export interface StoredReview {
  id: string;
  orderId: string;
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
    verified: true,
  }));
}

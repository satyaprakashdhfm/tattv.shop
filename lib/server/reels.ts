import "server-only";
import crypto from "node:crypto";
import { OrderError } from "@/lib/pricing";
import type { Reel } from "@/lib/reels";
import { query, transaction } from "./db";

// Home page videos (table `reels`), managed in Admin → Videos. Each can link to the product it shows,
// so tapping it opens that product. Uploaded clips are stored in the `media` table like photos.

export interface AdminReel {
  id: string;
  video: string;
  poster: string;
  caption: string;
  productSlug: string | null;
  active: boolean;
}

const MAX_REELS = 30;
const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mp4" };

/** Every video, in order (admin). */
export async function listReels(): Promise<AdminReel[]> {
  const r = await query("SELECT id, video, poster, caption, product_slug, active FROM reels ORDER BY sort_order, created_at");
  return r.rows.map((x) => ({ id: x.id, video: x.video, poster: x.poster, caption: x.caption, productSlug: x.product_slug, active: x.active }));
}

/** What the home page shows: switched-on videos, each with its product if that product is in the store. */
export async function storeReels(): Promise<Reel[]> {
  const r = await query(`
    SELECT r.id, r.video, r.poster, r.caption, p.slug, p.name FROM reels r
    LEFT JOIN products p ON p.slug = r.product_slug AND p.active
    WHERE r.active ORDER BY r.sort_order, r.created_at`);
  return r.rows.map((x) => ({ id: x.id, video: x.video, poster: x.poster, caption: x.caption, product: x.slug ? { slug: x.slug, name: x.name } : null }));
}

/** Stores an uploaded clip as it is (MP4 or WebM, up to 25 MB) and returns its /media URL. */
export async function saveVideo(file: File | null): Promise<string | null> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  const ext = VIDEO_TYPES[file.type];
  if (!ext) throw new OrderError(`${file.name} is not a video we can show. Please use MP4 (or WebM).`);
  if (file.size > 25 * 1024 * 1024) throw new OrderError(`${file.name} is larger than 25 MB. Please trim it or export it smaller (720p is plenty).`);
  const id = crypto.randomBytes(9).toString("base64url");
  const mime = ext === "webm" ? "video/webm" : "video/mp4";
  await query("INSERT INTO media (id, mime, data) VALUES ($1, $2, $3)", [id, mime, Buffer.from(await file.arrayBuffer())]);
  return `/media/${id}.${ext}`;
}

async function productOrNull(slug: unknown) {
  const s = String(slug || "").trim();
  if (!s) return null;
  const r = await query("SELECT 1 FROM products WHERE slug = $1", [s]);
  if (!r.rowCount) throw new OrderError("That product no longer exists. Pick another.");
  return s;
}

export async function addReel(input: { video: string | null; poster: string | null; caption: unknown; product: unknown }) {
  if (!input.video) throw new OrderError("Choose a video to upload.");
  const product = await productOrNull(input.product);
  await transaction(async (db) => {
    const n = (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM reels")).rows[0].n;
    if (n >= MAX_REELS) throw new OrderError(`You can keep up to ${MAX_REELS} videos. Delete one first.`);
    // New videos go first: the newest post leads, as on Instagram.
    await db.query("UPDATE reels SET sort_order = sort_order + 1");
    await db.query("INSERT INTO reels (id, video, poster, caption, product_slug, sort_order) VALUES ($1,$2,$3,$4,$5,0)", [
      "r_" + crypto.randomBytes(6).toString("hex"),
      input.video,
      input.poster || "",
      String(input.caption || "").trim().slice(0, 80),
      product,
    ]);
  });
}

export async function updateReel(id: string, input: { caption: unknown; product: unknown; active: boolean; poster?: string | null }) {
  const product = await productOrNull(input.product);
  const r = await query(
    "UPDATE reels SET caption = $2, product_slug = $3, active = $4, poster = COALESCE($5, poster) WHERE id = $1",
    [id, String(input.caption || "").trim().slice(0, 80), product, input.active, input.poster ?? null],
  );
  if (!r.rowCount) throw new OrderError("That video no longer exists.", 404);
}

export async function moveReel(id: string, dir: number | "top") {
  await transaction(async (db) => {
    const list = (await db.query<{ id: string }>("SELECT id FROM reels ORDER BY sort_order, created_at FOR UPDATE")).rows.map((x) => x.id);
    const i = list.indexOf(id);
    if (i < 0) return;
    if (dir === "top") {
      list.splice(i, 1);
      list.unshift(id);
    } else {
      const j = i + dir;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
    }
    await db.query("UPDATE reels r SET sort_order = x.n - 1 FROM unnest($1::text[]) WITH ORDINALITY AS x(k, n) WHERE r.id = x.k", [list]);
  });
}

/** Deletes the video and its uploaded clip and poster (videos are large; photos of past orders are never touched here). */
export async function deleteReel(id: string) {
  const r = await query<{ video: string; poster: string }>("DELETE FROM reels WHERE id = $1 RETURNING video, poster", [id]);
  const ids = r.rows.flatMap((x) => [x.video, x.poster]).map((u) => u.match(/^\/media\/([^.]+)\./)?.[1]).filter(Boolean);
  if (ids.length) await query("DELETE FROM media WHERE id = ANY($1)", [ids]);
}

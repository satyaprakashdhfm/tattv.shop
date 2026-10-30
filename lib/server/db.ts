import "server-only";
import pg from "pg";
import { SEED_CATEGORIES, SEED_PRODUCTS, type Product } from "@/lib/products";
import { DEFAULT_SETTINGS, SEED_COUPONS } from "@/lib/site";
import { SEED_REELS, reelPoster, reelVideo } from "@/lib/reels";
import { SAMPLE_REVIEWS } from "@/lib/reviews";

// Postgres access. DATABASE_URL is required (locally: ../tattv-local-env, see README).
//
// The schema is created and migrated here, the first time the app touches the database. It must
// stay idempotent and additive: add tables and columns, never drop or rename them.

const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS app_meta (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  title      text NOT NULL,
  blurb      text NOT NULL DEFAULT '',
  image      text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  slug        text PRIMARY KEY,
  name        text NOT NULL,
  category_id text NOT NULL REFERENCES categories(id) ON UPDATE CASCADE,
  collection  text NOT NULL DEFAULT 'classic' CHECK (collection IN ('modern', 'classic')),
  price       integer NOT NULL CHECK (price > 0),
  compare_at  integer CHECK (compare_at IS NULL OR compare_at > 0),
  material    text NOT NULL DEFAULT '',
  finish      text NOT NULL DEFAULT 'silver',
  size_label  text,
  size_values text[],
  badge       text,
  is_new      boolean NOT NULL DEFAULT false,
  bestseller  boolean NOT NULL DEFAULT false,
  short       text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  details     text[] NOT NULL DEFAULT '{}',
  stock       integer CHECK (stock IS NULL OR stock >= 0),
  active      boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id);

CREATE TABLE IF NOT EXISTS product_images (
  product_slug text NOT NULL REFERENCES products(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  position     integer NOT NULL,
  url          text NOT NULL,
  PRIMARY KEY (product_slug, position)
);

-- Uploaded photos (WebP bytes), served at /media/<id>.webp.
CREATE TABLE IF NOT EXISTS media (
  id         text PRIMARY KEY,
  mime       text NOT NULL,
  data       bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 104830;

CREATE TABLE IF NOT EXISTS orders (
  id                text PRIMARY KEY,
  token             text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  status            text NOT NULL,
  email             text NOT NULL,
  phone             text NOT NULL,
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  address           text NOT NULL,
  apartment         text NOT NULL DEFAULT '',
  city              text NOT NULL,
  state             text NOT NULL,
  pin               text NOT NULL,
  subtotal          integer NOT NULL,
  discount          integer NOT NULL DEFAULT 0,
  discount_code     text,
  shipping          integer NOT NULL DEFAULT 0,
  total             integer NOT NULL,
  payment_method    text NOT NULL,
  payment_status    text NOT NULL,
  razorpay_order_id text,
  payment_id        text,
  paid_at           timestamptz,
  tracking_courier  text,
  tracking_number   text,
  tracking_url      text,
  stock_applied     boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (email);
CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (phone);
CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_idx ON orders (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- Items keep their name, price and photo as sold, so editing or deleting a product never changes past orders.
CREATE TABLE IF NOT EXISTS order_items (
  order_id     text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  line_no      integer NOT NULL,
  product_slug text NOT NULL,
  name         text NOT NULL,
  size         text,
  price        integer NOT NULL,
  qty          integer NOT NULL CHECK (qty > 0),
  image        text NOT NULL DEFAULT '',
  PRIMARY KEY (order_id, line_no)
);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_slug);

-- The order timeline shown to the admin and the customer.
CREATE TABLE IF NOT EXISTS order_events (
  id       bigserial PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  at       timestamptz NOT NULL DEFAULT now(),
  status   text NOT NULL,
  note     text NOT NULL DEFAULT '',
  by_admin boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events (order_id, at);

-- Internal notes: admin only.
CREATE TABLE IF NOT EXISTS order_notes (
  id       bigserial PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  at       timestamptz NOT NULL DEFAULT now(),
  text     text NOT NULL
);

-- Contact form and return requests.
CREATE TABLE IF NOT EXISTS messages (
  id         text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  kind       text NOT NULL DEFAULT 'contact',
  name       text NOT NULL DEFAULT '',
  email      text NOT NULL,
  phone      text NOT NULL DEFAULT '',
  subject    text NOT NULL DEFAULT '',
  body       text NOT NULL,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived'))
);

-- Per-product Care and Shipping & Returns text (empty = the standard text).
ALTER TABLE products ADD COLUMN IF NOT EXISTS care text[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_returns text[] NOT NULL DEFAULT '{}';

-- Gift packing (added after launch of the schema, so existing databases get the columns too).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_wrap integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_message text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_occasion text NOT NULL DEFAULT '';

-- One-off data fix: categories seeded with the landscape photos switch to the arch photos the home page shows.
UPDATE categories SET image = '/images/categories/arch/' || id || '.jpg' WHERE image = '/images/categories/' || id || '.jpg';

-- Free shipping moved from ₹1,999 to ₹799: saved ribbon messages and product text follow.
UPDATE settings SET value = replace(value::text, '₹1,999', '₹799')::jsonb WHERE key = 'store' AND value::text LIKE '%₹1,999%';
UPDATE products SET shipping_returns = ARRAY(SELECT replace(x, '₹1,999', '₹799') FROM unnest(shipping_returns) AS x)
  WHERE array_to_string(shipping_returns, '|') LIKE '%₹1,999%';

-- TATTV's real contact details replace the placeholders saved at first start (a value typed in the admin is kept).
UPDATE settings SET value = jsonb_set(value, '{email}', '"contact@tattv.co.in"') WHERE key = 'store' AND value->>'email' = 'care@tattv.shop';
UPDATE settings SET value = jsonb_set(value, '{phone}', '"+91 90306 11790"') WHERE key = 'store' AND value->>'phone' = '+91 00000 00000';

-- Cost price: what TATTV pays for a piece. Admin only (never sent to the store), for profit.
-- Order lines keep the cost as it was when sold, like the price.
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price integer CHECK (cost_price IS NULL OR cost_price >= 0);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost integer;

-- Discount codes, made in Admin → Coupons. Times used are counted from the orders, so they can't drift.
-- owner_email / owner_phone link a code to one customer: only their orders can use it.
CREATE TABLE IF NOT EXISTS coupons (
  code             text PRIMARY KEY,
  kind             text NOT NULL DEFAULT 'percent' CHECK (kind IN ('percent', 'flat')),
  value            integer NOT NULL CHECK (value > 0),
  label            text NOT NULL DEFAULT '',
  active           boolean NOT NULL DEFAULT true,
  show_at_checkout boolean NOT NULL DEFAULT true,
  first_order_only boolean NOT NULL DEFAULT false,
  min_subtotal     integer NOT NULL DEFAULT 0,
  max_uses         integer NOT NULL DEFAULT 0,
  per_customer     integer NOT NULL DEFAULT 0,
  starts_at        timestamptz,
  expires_at       timestamptz,
  owner_email      text,
  owner_phone      text,
  note             text NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Instagram-style videos on the home page, each optionally linked to the product it shows.
CREATE TABLE IF NOT EXISTS reels (
  id           text PRIMARY KEY,
  video        text NOT NULL,
  poster       text NOT NULL DEFAULT '',
  caption      text NOT NULL DEFAULT '',
  product_slug text REFERENCES products(slug) ON UPDATE CASCADE ON DELETE SET NULL,
  active       boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- A star rating and a few words from the customer, once an order is delivered (one per order).
-- New reviews wait for the admin; only published ones show on the store.
CREATE TABLE IF NOT EXISTS reviews (
  id         text PRIMARY KEY,
  order_id   text NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  rating     integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      text NOT NULL DEFAULT '',
  body       text NOT NULL DEFAULT '',
  name       text NOT NULL DEFAULT '',
  city       text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden'))
);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews (status, created_at DESC);

-- The Delhivery booking for an order (waybill, state, weight, latest scan…), see lib/server/shipments.ts.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment jsonb;
CREATE INDEX IF NOT EXISTS orders_waybill_idx ON orders ((shipment->>'waybill')) WHERE shipment IS NOT NULL;

-- Reviews can also be written in the admin (no order): the source column says where each came from.
ALTER TABLE reviews ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'order';

-- Cash on delivery with an advance: plan 'advance' pays the advance column online at checkout and the rest on delivery.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_plan text NOT NULL DEFAULT 'full';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance integer NOT NULL DEFAULT 0;

-- A short video of a product (MP4 in the media table), shown in its gallery with the photos.
ALTER TABLE products ADD COLUMN IF NOT EXISTS video text NOT NULL DEFAULT '';

-- Delivery set-up (Admin → Delivery): each piece's packed weight, the places Delhivery collects from, and
-- the pickups asked for. Packaging / margin / fragile live in settings under the key 'parcel'.
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams integer CHECK (weight_grams IS NULL OR weight_grams > 0);
CREATE TABLE IF NOT EXISTS pickup_addresses (
  id            text PRIMARY KEY,
  name          text NOT NULL UNIQUE,
  contact       text NOT NULL DEFAULT '',
  phone         text NOT NULL,
  address       text NOT NULL,
  city          text NOT NULL,
  state         text NOT NULL,
  pin           text NOT NULL,
  is_default    boolean NOT NULL DEFAULT false,
  registered_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pickups (
  id           text PRIMARY KEY,
  pickup_date  date NOT NULL,
  pickup_time  text NOT NULL,
  count        integer NOT NULL,
  location     text NOT NULL,
  delhivery_id text,
  orders       jsonb NOT NULL DEFAULT '[]',
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- Customer accounts: signed in with a mobile number and a one-time code (MSG91). The number is the account.
CREATE TABLE IF NOT EXISTS customers (
  phone         text PRIMARY KEY,
  first_name    text NOT NULL DEFAULT '',
  last_name     text NOT NULL DEFAULT '',
  email         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz NOT NULL DEFAULT now()
);

-- One-time login codes we send ourselves (only a hash is kept), and MSG91 widget tokens already used.
CREATE TABLE IF NOT EXISTS otps (
  key     text PRIMARY KEY,
  hash    text NOT NULL,
  exp     timestamptz NOT NULL,
  tries   integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sends   timestamptz[] NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS otp_tokens (
  key text PRIMARY KEY,
  at  timestamptz NOT NULL DEFAULT now()
);
DELETE FROM otp_tokens WHERE at < now() - interval '2 days';

-- Policy pages (Shipping & Payment, Terms…), edited in Admin → Policies. A missing row shows the standard text.
CREATE TABLE IF NOT EXISTS policies (
  slug       text PRIMARY KEY,
  title      text NOT NULL,
  body       text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

export type Db = pg.PoolClient | pg.Pool;

let poolPromise: Promise<pg.Pool> | null = null;

export function dbConfigured() {
  return !!process.env.DATABASE_URL;
}

export function pool(): Promise<pg.Pool> {
  poolPromise ??= (async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Start ../tattv-local-env and add it to .env.local (see README).");
    const local = /localhost|127\.0\.0\.1|\.railway\.internal/.test(url);
    const p = new pg.Pool({
      connectionString: url,
      ssl: process.env.DATABASE_SSL === "false" || local ? false : { rejectUnauthorized: false },
      max: 5,
    });
    try {
      await p.query(SCHEMA);
      await seed(p);
      // Sample orders for a demo, on hosts where the seed script can't reach the database (see scripts/seed-demo.mjs).
      if (process.env.SEED_DEMO_DATA === "true") {
        const { seedDemo } = await import("../../scripts/seed-demo.mjs");
        console.log(await seedDemo(p));
      }
    } catch (e) {
      poolPromise = null;
      await p.end().catch(() => {});
      throw e;
    }
    return p;
  })();
  return poolPromise;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]) {
  return (await pool()).query<T>(text, params);
}

/** Runs `fn` in one transaction; rolls back if it throws. */
export async function transaction<T>(fn: (db: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await (await pool()).connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function insertProduct(client: pg.PoolClient, x: Product, sortOrder: number) {
  await client.query(
    `INSERT INTO products (slug, name, category_id, collection, price, compare_at, material, finish, size_label, size_values,
       badge, is_new, bestseller, short, description, details, stock, active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true,$18) ON CONFLICT DO NOTHING`,
    [x.slug, x.name, x.category, x.collection, x.price, x.compareAt ?? null, x.material, x.finish, x.sizes?.label ?? null, x.sizes?.values ?? null,
      x.badge ?? null, !!x.isNew, !!x.bestseller, x.short, x.description, x.details, x.soldOut ? 0 : null, sortOrder],
  );
  for (const [pos, url] of x.images.entries()) {
    await client.query("INSERT INTO product_images (product_slug, position, url) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [x.slug, pos, url]);
  }
}

/**
 * Pieces added to the starting catalogue after a store's database was first filled. Each batch is
 * copied in once, at the end of the shop order; deleting one in the admin later does not bring it back.
 */
const LATER_PRODUCTS: Record<string, string[]> = {
  "office-bags": ["tan-leather-office-messenger", "classic-leather-satchel", "black-leather-laptop-bag", "vintage-buckle-messenger"],
};

async function addLaterProducts(client: pg.PoolClient) {
  for (const [batch, slugs] of Object.entries(LATER_PRODUCTS)) {
    const added = await client.query("INSERT INTO app_meta (key, value) VALUES ($1, 'true') ON CONFLICT DO NOTHING", [`added:${batch}`]);
    if (!added.rowCount) continue;
    const { rows } = await client.query<{ n: number }>("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM products");
    let n = rows[0].n;
    for (const slug of slugs) {
      const x = SEED_PRODUCTS.find((p) => p.slug === slug);
      if (x) await insertProduct(client, x, n++);
    }
  }
}

/** Runs `fn` the first time only (marked in app_meta), on new and existing databases alike. */
async function once(client: pg.PoolClient, key: string, fn: () => Promise<void>) {
  const first = await client.query("INSERT INTO app_meta (key, value) VALUES ($1, 'true') ON CONFLICT DO NOTHING", [key]);
  if (first.rowCount) await fn();
}

// Features that moved from code into the admin: their starting rows, copied in once. After that the admin owns them.
async function addLaterData(client: pg.PoolClient) {
  await addLaterProducts(client);
  await once(client, "added:coupons", async () => {
    for (const [code, c] of Object.entries(SEED_COUPONS)) {
      await client.query(
        "INSERT INTO coupons (code, kind, value, label, first_order_only, min_subtotal) VALUES ($1, 'percent', $2, $3, $4, $5) ON CONFLICT DO NOTHING",
        [code, c.percent, c.label, !!c.firstOrderOnly, c.minSubtotal ?? 0],
      );
    }
  });
  // The sample reviews the home page showed, as published reviews the admin can edit, hide or delete.
  await once(client, "added:sample-reviews", async () => {
    for (const [i, r] of SAMPLE_REVIEWS.entries()) {
      await client.query(
        "INSERT INTO reviews (id, order_id, rating, title, body, name, city, status, source, created_at) VALUES ($1, NULL, 5, $2, $3, $4, $5, 'published', 'sample', now() - make_interval(days => $6))",
        [`rev_sample_${i + 1}`, r.title, r.quote, r.name, r.city, i],
      );
    }
  });
  await once(client, "added:reels", async () => {
    for (const [i, r] of SEED_REELS.entries()) {
      const linked = r.product ? (await client.query("SELECT 1 FROM products WHERE slug = $1", [r.product])).rowCount : 0;
      await client.query("INSERT INTO reels (id, video, poster, caption, product_slug, sort_order) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING", [
        r.id, reelVideo(r.id), reelPoster(r.id), r.caption, linked ? r.product : null, i,
      ]);
    }
  });
}

// First run only: copy the starting catalogue and default settings in. After that the admin owns them.
async function seed(p: pg.Pool) {
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(4231)");
    const done = await client.query("SELECT 1 FROM app_meta WHERE key = 'seeded'");
    if (done.rowCount) {
      await addLaterData(client);
      await client.query("COMMIT");
      return;
    }
    for (const [i, c] of SEED_CATEGORIES.entries()) {
      await client.query("INSERT INTO categories (id, name, title, blurb, image, sort_order) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING", [
        c.id, c.name, c.title, c.blurb, c.image, i,
      ]);
    }
    for (const [i, x] of SEED_PRODUCTS.entries()) await insertProduct(client, x, i);
    await client.query("INSERT INTO settings (key, value) VALUES ('store', $1) ON CONFLICT DO NOTHING", [
      JSON.stringify(DEFAULT_SETTINGS),
    ]);
    await client.query("INSERT INTO app_meta (key, value) VALUES ('seeded', $1)", [JSON.stringify(new Date().toISOString())]);
    // A fresh database already has every batch below.
    for (const batch of Object.keys(LATER_PRODUCTS)) await client.query("INSERT INTO app_meta (key, value) VALUES ($1, 'true') ON CONFLICT DO NOTHING", [`added:${batch}`]);
    await addLaterData(client);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

# TATTV: Men's Jewellery Storefront

Online store for **tattv.shop** with a built-in admin portal for orders, products, stock, customers and messages. Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Postgres.

## Run it locally

```bash
# 1. Database (sibling folder, not part of this repo)
cd ../tattv-local-env && npm install && npm run db     # Postgres 17 on localhost:5434

# 2. Store
cd ../tattv.shop
npm install
cp .env.example .env.local    # DATABASE_URL is already set for the local database
npm run dev                   # http://localhost:3000, admin at /admin
```

On first start the app creates its tables and copies in the starting catalogue (`lib/products.ts`). With `ADMIN_TEST_LOGIN=true` the admin login page offers a one-click test sign-in (admin / tattv-test). Without Razorpay keys, online payment opens a simulated window.

## Where things live

| Path | What it is |
| --- | --- |
| `app/(shop)/` | Storefront: home, `/shop`, `/product/[slug]`, `/cart`, `/checkout`, `/orders/[id]`, `/orders/track`, account, help pages |
| `app/admin/` | Admin portal: dashboard, orders, products, categories, stock & prices, customers, messages, settings, packing slips |
| `app/api/` | Orders, payments, order lookup, contact form, CSV export, Razorpay webhook |
| `lib/server/db.ts` | Postgres pool and the schema (created/migrated at boot; additive only: never drop or rename) |
| `lib/server/catalog.ts` | Products, categories, settings, photo uploads |
| `lib/server/orders.ts` | Checkout, payment confirmation, stock, admin order updates, messages |
| `lib/pricing.ts` | Order pricing and checkout validation, shared by browser and server |
| `lib/catalog.ts` | Catalogue helpers (related products, "Complete the Look" recommendations, search) |
| `lib/site.ts` | Contact details, order statuses, the starting coupon codes |
| `lib/server/coupons.ts` | Discount codes and their rules (Admin → Coupons) |
| `lib/server/reels.ts` | Home page videos, each linked to a product (Admin → Videos) |
| `lib/server/reviews.ts` | Star ratings from delivered orders (Admin → Reviews). `lib/reviews.ts` holds the sample reviews shown until one is published |
| `lib/policies.ts` | Standard text of the policy pages (`/policies/…`), edited in Admin → Policies. **Placeholder drafts: replace with approved text before launch** |
| `lib/server/otp.ts`, `lib/server/customers.ts` | Customer sign-in with a mobile number and an MSG91 code |
| `lib/server/delhivery.ts`, `lib/server/shipments.ts` | Delhivery: PIN-code checks, booking, labels, tracking |
| `lib/server/search-console.ts` | Google Search reports (Admin → Google Search) |

## Database tables

`categories`, `products` (with an admin-only `cost_price`), `product_images`, `orders` (with the Delhivery `shipment`), `coupons`, `reels`, `reviews`, `policies`, `customers`, `otps`, `otp_tokens`, `order_items` (name, size and price as sold), `order_events` (timeline), `order_notes` (admin only), `messages` (contact form and return requests), `settings` (social links, announcement), `media` (uploaded photos), `app_meta`. Order numbers come from `order_number_seq` (`TTV-104830` onwards).

## Common edits

In the admin (`/admin`), live immediately:

- **Products**: add, edit, hide, delete, reorder; photos, sizes, badges → Products
- **Prices and stock for every piece at once** → Stock & Prices
- **Categories** → Categories
- **Instagram / Facebook / X links, announcement ribbon** → Settings

- **Coupons**: codes, % or ₹ off, rules, link to one customer, times used → Coupons
- **Home page videos** and the product each one opens → Videos
- **Reviews** from delivered orders: publish or hide → Reviews
- **Policy pages** (Shipping & Payment, Returns, Terms, Privacy) → Policies
- **Cost price** on each product, for profit on the dashboard → Products

Free shipping starts at ₹799 (`FREE_SHIPPING_THRESHOLD` in `lib/format.ts`).

## How an order flows

1. Checkout sends the bag to `POST /api/orders`. The server re-prices everything from the database, checks sizes, stock (rows are locked) and the coupon, and saves the order.
2. **Cash on delivery** orders are confirmed straight away. **Online** orders open Razorpay; the payment signature is verified on the server before the order is confirmed.
3. Confirming an order reduces stock; cancelling it in the admin puts the stock back.
4. In the admin the order moves through *New → Packed → Shipped → Out for delivery → Delivered*, with courier tracking and a WhatsApp message to the customer. The customer's order page updates to match.

## Hosting (Railway)

Railway project **tattv.shop**: the `tattv-develop` service builds the `develop` branch (https://tattv-develop-production.up.railway.app) and uses the project's `Postgres` service through `DATABASE_URL=${{Postgres.DATABASE_URL}}`. The tables and starting catalogue are created on first start. Uploaded photos are stored in the database (`media` table), so no volume is needed. The `tattv.shop` service builds `main` (coming-soon page).

## Not yet connected

Customer sign-in on `/account` is still the browser-only demo (`lib/demo-account.ts`); guests find orders through `/orders/track`.

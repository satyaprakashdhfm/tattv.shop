# TATTV: Men's Jewellery Storefront

Frontend for **tattv.shop**, built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Structure

| Path | What it is |
| --- | --- |
| `app/` | Routes: home, `/shop` (filters via URL), `/product/[slug]`, `/cart`, `/checkout`, `/wishlist`, `/account`, `/collections`, `/about`, `/help` |
| `components/` | Header + mega menu, cart drawer, search overlay, product card/rail, footer |
| `components/store-provider.tsx` | Cart & wishlist state, persisted to `localStorage` |
| `components/product-art.tsx` | Procedural SVG product renderings, placeholders until real photography exists |
| `lib/products.ts` | Product catalogue, categories, collections, Pancha Tattva elements |
| `lib/navigation.ts` | Main navigation and mega-menu content |
| `scripts/prepare-logos.mjs` | Builds `public/brand/*` and `app/icon.png` from `images/Bag logo.jpg.jpeg` (`npm run prepare-logos`) |

## Not yet implemented (frontend only)

Checkout, sign-in and newsletter forms are UI only; no payment, auth or email backend is connected.
Product data is static in `lib/products.ts`, ready to be swapped for a commerce backend/CMS.

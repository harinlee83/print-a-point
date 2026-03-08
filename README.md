# PrintaPoint

Nuxt 4 app for designing premium custom map posters client-side, then purchasing prints with Stripe Checkout and Printful fulfillment.

## What is implemented

- Marketing homepage marketplace (`/`) with:
  - Hero + no-signup CTA
  - Sample gallery sourced from `maptoposter`
  - "How it works" + conversion CTA blocks
- Fully client-side editor UI (Nuxt + Vue + Pinia)
- Editor moved to `/create`
- Live MapLibre poster preview with:
  - Location search (Nominatim) — fixed to prioritize English results
  - Manual lat/lon + distance controls (default distance: 2000)
  - Terraink theme set (including additional themes)
  - Per-layer color overrides
  - Typography controls
  - Orientation Selector (Portrait / Landscape)
  - Editable map mode (pan/zoom/rotation)
- Expanded Product Catalog:
  - Enhanced Matte Paper Posters
  - Framed Posters (Black, White, Walnut)
  - Stretched Canvases
  - Framed Canvases (Black, White, Walnut)
- High-resolution export before checkout (PNG at print dimensions)
- Server routes for commerce + fulfillment:
  - `POST /api/upload` (Cloudflare R2)
  - `POST /api/checkout` (Stripe Checkout Session with full variant support)
  - `POST /api/webhook` (Stripe webhook -> Printful order)
  - `POST /api/mockup` + polling (Printful Mockup Generator)
  - `GET /api/stripe-session` (success page)
  - `GET /api/catalog` and `GET /api/shipping-countries`
- Success page (`/success`)

## Poster sizes (v1)

- `18x24 in` -> `5400x7200` px
- `24x36 in` -> `7200x10800` px
- `30x40 in` -> `9000x12000` px

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill all required values.

3. Start dev server:

```bash
npm run dev
```

## Build check

```bash
npm run build
```

## Required environment variables

See `.env.example` for full list.

Minimum required to test end-to-end checkout + fulfillment:

- `NUXT_STRIPE_SECRET_KEY`
- `NUXT_STRIPE_WEBHOOK_SECRET`
- `NUXT_PRINTFUL_API_KEY`
- `NUXT_CF_ACCOUNT_ID`
- `NUXT_R2_ACCESS_KEY_ID`
- `NUXT_R2_SECRET_ACCESS_KEY`
- `NUXT_R2_BUCKET_NAME`
- `NUXT_R2_PUBLIC_URL`
- `NUXT_PRINTFUL_VARIANT_18X24`
- `NUXT_PRINTFUL_VARIANT_24X36`
- `NUXT_PRINTFUL_VARIANT_30X40`

Optional:

- `NUXT_PRICE_18X24`, `NUXT_PRICE_24X36`, `NUXT_PRICE_30X40`
- `NUXT_ALLOWED_COUNTRIES`
- `NUXT_PUBLIC_BASE_URL`

## Notes

- Poster output intentionally removes on-image credits/attribution text.
- Attribution is shown subtly in the website footer.
- Checkout country allowlist is fetched from Printful by default, with fallback list if unavailable.

# Printful Product Type Integration

## Product Types

PrintAPoint supports 4 product types, each with its own sizes, pricing, and options:

| Product Type | ID | Printful Product ID | Frame Options | Sizes |
|---|---|---|---|---|
| Enhanced Matte Paper Poster | `poster` | 1 | No | 18x24, 24x36, 30x40 |
| Enhanced Matte Paper Framed Poster | `framed-poster` | 2 | Black, White, Walnut | 18x24, 24x36, 30x40 |
| Stretched Canvas | `canvas` | TBD (use discovery endpoint) | No | 12x16, 18x24, 24x36 |
| Framed Canvas | `framed-canvas` | TBD (use discovery endpoint) | Black, White, Walnut | 12x16, 18x24, 24x36 |

Product definitions live in `shared/productCatalog.ts`.

---

## Setup: Discovering Printful Variant IDs

Before checkout works for any product type, you need to populate the corresponding env vars with real Printful variant IDs.

### 1. Run the discovery endpoint

```
GET /api/discover-catalog
```

Requires `NUXT_PRINTFUL_API_KEY` to be set. Returns all Printful wall-art products with their variant IDs, sizes, colors, and prices.

### 2. Map variant IDs to env vars

Each product variant maps to a specific env var. The naming convention is:

```
NUXT_PRINTFUL_VARIANT_{TYPE}_{SIZE}[_{FRAME}]
```

Examples:
- `NUXT_PRINTFUL_VARIANT_POSTER_18X24=12345`
- `NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_18X24_BLACK=12346`
- `NUXT_PRINTFUL_VARIANT_CANVAS_18X24=12347`
- `NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_18X24_BLACK=12348`

### 3. Optional price overrides

Replace `_VARIANT_` with `_PRICE_` in any env var name to override the default price (in cents):

```
NUXT_PRINTFUL_PRICE_POSTER_18X24=9500
```

---

## Environment Variables

### Legacy (still supported)

These continue to work for the original poster-only flow:

```env
NUXT_PRINTFUL_VARIANT_18X24=
NUXT_PRINTFUL_VARIANT_24X36=
NUXT_PRINTFUL_VARIANT_30X40=
NUXT_PRICE_18X24=
NUXT_PRICE_24X36=
NUXT_PRICE_30X40=
```

### New Product Catalog

**Poster:**
```env
NUXT_PRINTFUL_VARIANT_POSTER_18X24=
NUXT_PRINTFUL_VARIANT_POSTER_24X36=
NUXT_PRINTFUL_VARIANT_POSTER_30X40=
```

**Framed Poster** (one per size per frame color):
```env
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_18X24_BLACK=
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_18X24_WHITE=
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_18X24_WALNUT=
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_24X36_BLACK=
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_24X36_WHITE=
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_24X36_WALNUT=
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_30X40_BLACK=
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_30X40_WHITE=
NUXT_PRINTFUL_VARIANT_FRAMED_POSTER_30X40_WALNUT=
```

**Canvas:**
```env
NUXT_PRINTFUL_VARIANT_CANVAS_12X16=
NUXT_PRINTFUL_VARIANT_CANVAS_18X24=
NUXT_PRINTFUL_VARIANT_CANVAS_24X36=
```

**Framed Canvas** (one per size per frame color):
```env
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_12X16_BLACK=
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_12X16_WHITE=
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_12X16_WALNUT=
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_18X24_BLACK=
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_18X24_WHITE=
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_18X24_WALNUT=
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_24X36_BLACK=
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_24X36_WHITE=
NUXT_PRINTFUL_VARIANT_FRAMED_CANVAS_24X36_WALNUT=
```

---

## Architecture

### Shared Types (`shared/productCatalog.ts`)

Core types and data for the product system:

- `ProductTypeId` — `"poster" | "framed-poster" | "canvas" | "framed-canvas"`
- `FrameColorId` — `"black" | "white" | "walnut"`
- `ProductVariant` — size, dimensions, pixel targets, default price, env var key
- `ProductType` — label, description, Printful product ID, frame options, variants
- `PRODUCT_TYPES` — array of all 4 product type definitions

Helper functions:
- `getProductTypeById(id)` — lookup product type
- `getAvailableSizes(productTypeId, frameColorId?)` — get sizes for a product/frame combo
- `getVariantEnvKey(productTypeId, sizeLabel, frameColorId?)` — resolve env var key
- `getStartingPrice(productTypeId)` — lowest price across sizes
- `formatUsd(cents)` — format cents to `$XX`

The legacy `shared/posterSizes.ts` is kept unchanged for backward compatibility.

### Server-Side Catalog (`server/utils/sizeCatalog.ts`)

- `getServerProductCatalog(event?)` — returns all products with resolved variant IDs and prices from env vars
- `getServerVariant(productTypeId, sizeLabel, frameColorId?, event?)` — resolve a specific variant
- `getServerPosterSizes(event?)` — legacy function, still works

### Catalog API (`server/api/catalog.get.ts`)

Returns both formats:
- `products` — full product catalog with availability per variant
- `sizes` — legacy poster-only sizes (backward compat)

### Checkout (`server/api/checkout.post.ts`)

Accepts two flows:

**New flow** (preferred):
```json
{
  "imageUrl": "https://...",
  "productTypeId": "framed-poster",
  "sizeLabel": "18 x 24 in",
  "frameColor": "black",
  "locationLabel": "...",
  "displayCity": "...",
  "displayCountry": "...",
  "themeId": "..."
}
```

**Legacy flow** (still supported):
```json
{
  "imageUrl": "https://...",
  "sizeId": "18x24",
  "locationLabel": "...",
  ...
}
```

The webhook (`server/api/webhook.post.ts`) requires no changes — it reads `printfulVariantId` from Stripe metadata regardless of product type.

### Mockup Generation

Two endpoints for on-demand Printful mockup generation (Currently Implemented):

- `POST /api/mockup` — create a mockup task. Body: `{ imageUrl, productId, variantIds }`. Returns `{ taskKey }`.
- `GET /api/mockup-status?task_key=...` — poll task status. Returns `{ status, mockups, error }`.

Rate limited by Printful (10 requests/min for established stores). Frontend must implement polling for the final image.

### Pinia Store (`app/stores/map.ts`)

New state:
- `selectedProductType: ProductTypeId` (default: `"poster"`)
- `selectedFrameColor: FrameColorId` (default: `"black"`)

New getters:
- `selectedProduct` — full ProductType object
- `availableSizes` — ProductVariant[] for current product + frame
- `selectedVariant` — current variant matching selected size
- `needsFrameSelection` — boolean, true for framed products

New actions:
- `setProductType(id)` — change product type, resets size to first available
- `setFrameColor(id)` — change frame color

### UI Components

**`ProductTypeSelector.vue`** — 2-column grid of product cards in the right sidebar. Shows short label and starting price. Placed above frame/size selectors.

**`FrameColorSelector.vue`** — row of color swatches (black, white, walnut). Only visible when a framed product is selected.

**`SizeSelector.vue`** — updated to accept `ProductVariant[]` and emit `sizeLabel` strings instead of `PosterSizeId`. Sizes update dynamically based on product type.

**`PosterPreview.vue`** — wraps `.poster-frame` in a `.product-preview` div with dynamic CSS classes:
- `.product-preview--poster` — no decoration (original behavior)
- `.product-preview--framed-poster` — CSS frame border using `--frame-color`
- `.product-preview--canvas` — depth shadow effect
- `.product-preview--framed-canvas` — frame border + depth

### Share Config (`app/composables/useShareConfig.ts`)

URL query parameters now include `productType` and `frameColor` so shared links preserve the full product selection.

---

## File Summary

| Action | File | Purpose |
|--------|------|---------|
| Created | `shared/productCatalog.ts` | Product type definitions and helpers |
| Created | `app/components/ProductTypeSelector.vue` | Product format selector UI |
| Created | `app/components/FrameColorSelector.vue` | Frame color selector UI |
| Created | `server/api/discover-catalog.get.ts` | Printful catalog discovery (dev setup) |
| Created | `server/api/mockup.post.ts` | Mockup generation task creation |
| Created | `server/api/mockup-status.get.ts` | Mockup task status polling |
| Modified | `app/stores/map.ts` | Added product type state/getters/actions |
| Modified | `app/components/CustomizerPanel.vue` | Wired up new selectors in sidebar |
| Modified | `app/components/SizeSelector.vue` | Dynamic sizes from ProductVariant[] |
| Modified | `app/components/PosterPreview.vue` | CSS product preview wrapper |
| Modified | `app/assets/css/main.css` | Styles for new components and preview |
| Modified | `server/utils/sizeCatalog.ts` | Full product catalog resolution |
| Modified | `server/api/catalog.get.ts` | Returns full product catalog |
| Modified | `server/api/checkout.post.ts` | Accepts product type checkout flow |
| Modified | `app/pages/create.vue` | Passes product type to checkout |
| Modified | `app/composables/useShareConfig.ts` | Shares product type in URL |
| Modified | `nuxt.config.ts` | All new variant env var keys |
| Unchanged | `shared/posterSizes.ts` | Backward compatibility |
| Unchanged | `server/api/webhook.post.ts` | Already product-agnostic |
| Unchanged | `server/utils/printful.ts` | No changes needed |

---

## Verification Checklist

1. **Discovery** — `GET /api/discover-catalog` returns Printful products and variant IDs
2. **UI** — selecting each product type updates sizes, frame selector shows/hides, preview style changes
3. **Preview** — CSS frame/canvas preview renders for all 4 types with all frame colors
4. **Mockup** — `POST /api/mockup` + polling `GET /api/mockup-status` returns mockup images
5. **Checkout** — test checkout for each product type sends correct variant ID in Stripe metadata
6. **Share** — shared link with framed canvas selection restores product type and frame color
7. **Mobile** — right sidebar remains usable on small screens

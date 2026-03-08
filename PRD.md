# Product Requirements Document
## PrintaPoint

**Version:** 1.0  
**Stack:** Nuxt 4 · Stripe Checkout · Printful API · Cloudflare R2 · Vercel  
**Philosophy:** Quality over everything. No auth, no database, no bloat. Ship fast, print beautifully.

---

## 1. Product Overview

A direct-to-consumer web application that allows users to design a custom map poster of any location — choosing themes, typography, and layout — and purchase a museum-quality print delivered to their door. Printful handles all printing, packaging, and shipping. The app handles nothing physical.

The product competes with Mapiful and MapPrints but wins on design quality, customization depth, and performance. The entire experience from customization to checkout must feel premium.

---

## 2. Core User Journey

```
Land on site
    → Choose a location (search or coords)
    → Customize map (theme, colors, typography, size)
    → Preview poster in real time
    → Click "Buy Print"
    → Enter email + shipping at Stripe Checkout
    → Receive order confirmation email (via Stripe)
    → Printful prints and ships
    → Customer receives tracking email (via Printful)
```

No account creation. No login wall. No friction between design and purchase.

---

## 3. Tech Stack (Opinionated & Final)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Nuxt 4** | Full-stack in one repo; server routes handle Stripe + Printful; SSR for SEO |
| Deployment | **Vercel** | Zero-config Nuxt support; serverless functions; edge network for global performance |
| Payments | **Stripe Checkout** | Hosted, PCI-compliant; handles tax, receipts, and failed payments automatically |
| Fulfillment | **Printful API** | Best print quality in POD space; reliable API; handles shipping + tracking natively |
| Image Storage | **Cloudflare R2** | Free egress; S3-compatible API; Printful fetches the PNG from a public URL |
| Styling | **Tailwind CSS v4** | Utility-first; no design system overhead |
| State | **Pinia** | Nuxt-native; holds map customization state across components |
| No auth | ✅ Intentional | Adds complexity with zero v1 benefit; revisit only if saved designs are requested |
| No database | ✅ Intentional | Stripe + Printful are the sources of truth for orders |

---

## 4. Application Architecture

```
print-a-point/
├── app/
│   ├── components/
│   │   ├── MapCanvas.vue          # Renders live map preview
│   │   ├── CustomizerPanel.vue    # Location, theme, typography controls
│   │   ├── PosterPreview.vue      # Framed poster mockup shown to user
│   │   └── SizeSelector.vue      # Print size picker with pricing
│   ├── pages/
│   │   ├── index.vue              # Main editor (customizer + preview)
│   │   └── success.vue            # Post-purchase confirmation page
│   ├── stores/
│   │   └── map.ts                 # Pinia store for all customization state
│   └── composables/
│       ├── useExport.ts           # PNG export logic at print resolution
│       └── usePricing.ts          # Size → price mapping
├── server/
│   └── api/
│       ├── upload.post.ts         # Receives PNG, uploads to R2, returns URL
│       ├── checkout.post.ts       # Creates Stripe Checkout session
│       └── webhook.post.ts        # Stripe webhook → Printful order creation
├── public/
└── nuxt.config.ts
```

---

## 5. Feature Requirements

### 5.1 Map Customization (Frontend — Already Built)

The following are considered complete based on existing frontend code found in terraink. YOU WILL NEED TRANSLATE THE REACT CODE OVER TO VUE CODE FOR THE NUXT FRAMEWORK. Document them here for completeness and QA reference.

- **Location search** — Geocoding by place name or raw lat/lng coordinates (localized to English)
- **Themes** — Neon Cyberpunk, Minimal Light, Minimal Dark, Watercolor, Blueprint, and more.
- **Color customization** — Per-layer color overrides (roads, water, parks, buildings, background)
- **Typography** — City name (large), country name (medium), coordinates (small); font family selection
- **Orientation** — Toggle between **Vertical (Portrait)** and **Horizontal (Landscape)**
- **Product Formats** — Posters, Framed Posters, Stretched Canvases, and Framed Canvases
- **Live preview** — Poster frame mockup updates in real time as user customizes
- **PNG export** — High-resolution export function (see Section 6 for resolution requirements)

### 5.2 Size & Pricing

| Size | Dimensions | Printful Base Cost | Recommended Retail | Margin |
|---|---|---|---|---|
| A4 | 21 × 29.7 cm | ~$12 | $35 | ~65% |
| 18×24" | 45.7 × 61 cm | ~$18 | $55 | ~67% |
| 24×36" | 61 × 91.4 cm | ~$24 | $75 | ~68% |

> Pricing is subject to Printful rate changes. Fetch live base costs from Printful's `/mockup-generator/printfiles` endpoint before finalizing retail prices.

### 5.3 Checkout Flow

1. User selects size and clicks **"Buy Print — $XX"**
2. Frontend calls `POST /api/checkout` with `{ imageUrl, size, locationLabel }`
3. Server creates a Stripe Checkout Session with:
   - Line item: poster name + size, unit price
   - `success_url`: `/success?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/` (returns to editor with state preserved)
   - Metadata: `{ imageUrl, size, printfulVariantId }`
   - `shipping_address_collection`: enabled (all countries Printful ships to)
   - `automatic_tax`: enabled (Stripe Tax handles VAT/sales tax globally)
4. User is redirected to Stripe-hosted checkout page
5. On payment success, Stripe fires `checkout.session.completed` webhook

### 5.4 Order Fulfillment (Webhook)

`POST /server/api/webhook.post.ts`

```typescript
// Pseudocode — see Section 8 for full implementation
1. Verify Stripe webhook signature (STRIPE_WEBHOOK_SECRET)
2. Extract session metadata: { imageUrl, size, printfulVariantId }
3. Extract shipping address from session.shipping_details
4. POST to Printful /orders:
   {
     recipient: { name, address1, city, state_code, zip, country_code },
     items: [{
       variant_id: printfulVariantId,
       quantity: 1,
       files: [{ type: "default", url: imageUrl }]
     }]
   }
5. Printful auto-confirms and fulfills (if auto-confirm is enabled in dashboard)
6. Return 200 to Stripe
```

Printful will send the customer a shipping confirmation + tracking number directly via their own email system using the email captured at Stripe Checkout.

---

## 6. Image Export Requirements

This is the most critical quality gate in the entire product.

### Resolution Targets

| Poster Size | Required PNG Dimensions | DPI |
|---|---|---|
| A4 | 2480 × 3508 px | 300 |
| 18×24" | 5400 × 7200 px | 300 |
| 24×36" | 7200 × 10800 px | 300 |

### Export Implementation (`useExport.ts`)

```typescript
export async function exportMapPng(targetWidthPx: number, targetHeightPx: number): Promise<Blob> {
  // Scale the map canvas up to print resolution
  // Use devicePixelRatio multiplier or canvas.width override
  // Return Blob for upload
}
```

**Key constraints:**
- Export must happen **before** checkout is initiated — not after. The PNG URL must exist before the Stripe session is created.
- Show a loading state during export ("Preparing your print...") — high-res export can take 2–5 seconds.
- If the map uses WebGL (e.g. Mapbox GL JS), use `map.getCanvas().toDataURL()` at the correct scale. Mapbox supports `preserveDrawingBuffer: true` for this.
- Validate PNG dimensions client-side before uploading. Reject anything below minimum resolution with a user-facing error.

---

## 7. Cloudflare R2 Integration

R2 stores the high-res PNG so Printful can fetch it via a public URL.

### Bucket Configuration
- Public read access enabled (Printful must be able to fetch without auth)
- CORS configured to allow uploads from your Vercel domain
- Object lifecycle: delete after 30 days (orders are fulfilled within 48h)

### Upload Flow (`/server/api/upload.post.ts`)

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find(f => f.name === 'file')
  
  const key = `orders/${crypto.randomUUID()}.png`
  
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.data,
    ContentType: 'image/png',
  }))

  return {
    url: `${process.env.R2_PUBLIC_URL}/${key}`
  }
})
```

---

## 8. Stripe Integration

### Environment Variables
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Checkout Session (`/server/api/checkout.post.ts`)

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default defineEventHandler(async (event) => {
  const { imageUrl, size, printfulVariantId } = await readBody(event)
  
  const prices = { a4: 3500, '18x24': 5500, '24x36': 7500 } // cents
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Custom Map Poster — ${size.toUpperCase()}`,
          description: 'Museum-quality giclée print. Ships in 3–5 business days.',
        },
        unit_amount: prices[size],
      },
      quantity: 1,
    }],
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK'],
    },
    automatic_tax: { enabled: true },
    metadata: { imageUrl, size, printfulVariantId },
    success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/`,
  })

  return { url: session.url }
})
```

### Webhook (`/server/api/webhook.post.ts`)

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default defineEventHandler(async (event) => {
  const sig = getHeader(event, 'stripe-signature')
  const body = await readRawBody(event)
  
  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    throw createError({ statusCode: 400, message: 'Webhook signature invalid' })
  }
  
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object
    const { imageUrl, printfulVariantId } = session.metadata
    const shipping = session.shipping_details
    
    await $fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: {
        recipient: {
          name: shipping.name,
          address1: shipping.address.line1,
          address2: shipping.address.line2,
          city: shipping.address.city,
          state_code: shipping.address.state,
          country_code: shipping.address.country,
          zip: shipping.address.postal_code,
          email: session.customer_details.email,
        },
        items: [{
          variant_id: Number(printfulVariantId),
          quantity: 1,
          files: [{ type: 'default', url: imageUrl }],
        }],
      },
    })
  }

  return { received: true }
})
```

---

## 9. Printful Configuration

### Setup Steps (Printful Dashboard)
1. Create a Printful store — choose "API platform" (not Etsy/Shopify)
2. Enable **auto-confirmation** of orders (Settings → Orders → Auto-confirm)
3. Add your billing method (Printful charges per order as it's placed)
4. Generate an API token (Settings → API)
5. Configure your return address (shown on packing slip)
6. Optionally upload a packing slip logo for brand consistency

### Product Variants to Use
Printful's poster product is **Framed Poster** (ID varies by region) or **Enhanced Matte Paper Poster**.

Recommended: **Enhanced Matte Paper Poster** — best color reproduction for map art, no glass glare in lifestyle photos.

Fetch current variant IDs:
```
GET https://api.printful.com/products
```
Then filter for your target paper/size combinations and hardcode the variant IDs in your app config.

### What Printful Handles (You Do Nothing)
- ✅ Printing
- ✅ Quality control
- ✅ Packaging (rolled tube or flat depending on size)
- ✅ Shipping label generation
- ✅ Carrier selection
- ✅ Customer tracking email with tracking number
- ✅ Returns/reprints for damaged orders (contact their support)

---

## 10. Vercel Deployment

### `nuxt.config.ts`
```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel',
  },
  runtimeConfig: {
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    printfulApiKey: '',
    r2AccessKeyId: '',
    r2SecretAccessKey: '',
    r2BucketName: '',
    r2PublicUrl: '',
    cfAccountId: '',
    public: {
      stripePublishableKey: '',
    }
  }
})
```

### Environment Variables (Vercel Dashboard)
```
NUXT_STRIPE_SECRET_KEY
NUXT_STRIPE_WEBHOOK_SECRET
NUXT_PRINTFUL_API_KEY
NUXT_R2_ACCESS_KEY_ID
NUXT_R2_SECRET_ACCESS_KEY
NUXT_R2_BUCKET_NAME
NUXT_R2_PUBLIC_URL
NUXT_CF_ACCOUNT_ID
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
BASE_URL=https://yourdomain.com
```

### Stripe Webhook Registration
In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://yourdomain.com/api/webhook`
- Events to listen for: `checkout.session.completed` only

---

## 11. Success Page (`/pages/success.vue`)

The success page should:
- Fetch the Stripe session by `session_id` from query param (`/api/stripe-session?id=...`)
- Display order confirmation with the customer's email
- Show an estimated delivery window (Printful standard: 3–5 business days production + shipping)
- Offer a "Design Another" CTA back to the editor
- **Do not** show order numbers or tracking here — Printful emails that directly

---

## 12. Quality Checklist (Pre-Launch)

### Print Quality
- [ ] PNG exported at correct resolution for each size (validated via Image → Image Size in Photoshop or equivalent)
- [ ] Test order placed via Printful for each size — inspect physical print for color accuracy
- [ ] Confirm dark backgrounds (like Neon Cyberpunk theme) print correctly — dark themes often lose shadow detail on matte paper
- [ ] Safe zone margins verified — Printful recommends keeping text/important content 3mm from edge

### Payment
- [ ] Stripe webhook tested end-to-end in test mode (`stripe listen --forward-to localhost:3000/api/webhook`)
- [ ] Webhook signature verification confirmed working
- [ ] Automatic tax enabled and tested for US + EU customers
- [ ] Stripe Radar fraud rules reviewed (defaults are fine for v1)

### Ops
- [ ] Printful auto-confirm enabled
- [ ] Printful billing method added with sufficient credit/card on file
- [ ] R2 lifecycle rule set (30-day auto-delete)
- [ ] Vercel function timeout set to 30s (for webhook handler — Printful API can be slow)
- [ ] Error alerting configured (Vercel email alerts or Sentry free tier)

---

## 13. What This Is NOT (Deliberately Excluded from v1)

| Feature | Why Excluded |
|---|---|
| User accounts / auth | Zero v1 benefit; adds Supabase dependency and auth UI |
| Saved designs | Requires database; not needed for core purchase flow |
| Order history page | Stripe dashboard covers this for you; Printful emails cover it for customers |
| Multiple quantities | Simplifies checkout; add in v2 if requested |
| Framing options | Increases SKU complexity; sell unframed first |
| Discount codes | Stripe Checkout supports this natively — enable when needed, zero code |
| Custom domain email | Use Stripe + Printful's built-in transactional emails for v1 |

---

## 14. v2 Considerations (Post-Revenue)

Only build these once v1 is generating orders:

- **Saved designs** — Add Supabase + auth; let users return to their design via a shareable URL
- **Framing add-on** — Printful offers framed variants; add as an upsell at checkout
- **Bulk / gift orders** — Quantity selector + gift message field
- **Affiliate program** — Rewardful + Stripe integrate cleanly
- **International pricing** — Stripe's multi-currency support + Printful's regional fulfillment centers

---

## 15. Estimated Build Time

| Task | Estimate |
|---|---|
| R2 bucket setup + upload endpoint | 2h |
| Stripe Checkout session endpoint | 2h |
| Stripe webhook + Printful order creation | 3h |
| PNG export at print resolution (if not already done) | 2–4h |
| Success page | 1h |
| End-to-end test order (real money, real print) | 1h |
| Deploy + domain setup on Vercel | 1h |
| **Total** | **~12–14h** |

This is a genuine weekend project. The frontend is done. The backend is three API routes.

---

*Last updated: March 2026*

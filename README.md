# PrintaPoint

Nuxt 4 app for designing premium custom map posters client-side, then purchasing prints with Stripe Checkout and Printful fulfillment.

## Local setup

```bash
npm install
cp .env.example .env
# Fill in your keys in .env
npm run dev
```

## Build

```bash
npm run build
```

## Environment Variables

See `.env.example` for the full list.

| Variable | Description |
|---|---|
| `NUXT_PUBLIC_BASE_URL` | App base URL (`http://localhost:3000` for dev, `https://www.printapoint.com` for prod) |
| `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NUXT_STRIPE_SECRET_KEY` | Stripe secret key |
| `NUXT_STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NUXT_STRIPE_ALLOWED_COUNTRIES` | Comma-separated country codes for checkout (e.g. `US,CA,GB`) |
| `NUXT_PRINTFUL_API_KEY` | Printful API token |
| `NUXT_PRINTFUL_MOCK_API` | `true` to skip Printful API calls and log order data instead |
| `NUXT_PRINTFUL_CONFIRM_ORDERS` | `true` to auto-confirm orders for fulfillment. `false` (default) creates drafts in Printful |
| `NUXT_CF_ACCOUNT_ID` | Cloudflare account ID |
| `NUXT_R2_ACCESS_KEY_ID` | R2 access key ID |
| `NUXT_R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `NUXT_R2_BUCKET_NAME` | R2 bucket name |
| `NUXT_R2_PUBLIC_URL` | R2 public URL for serving uploaded images |

## Testing Printful Orders

Test the Printful v2 API directly using a Stripe webhook body:

```bash
export $(grep -v '^#' .env | xargs) && npx tsx scripts/test-printful-order.ts
```

This reads `scripts/test_webhook_body.json`, extracts order data (shipping, variant, image URL, orientation), and sends a draft order to Printful's v2 API. The full request and response are printed to the console.

To get a test webhook body: make a test purchase with Stripe test mode, then copy the webhook event payload from **Stripe Dashboard > Developers > Webhooks** into `scripts/test_webhook_body.json`.

## Server Routes

| Route | Description |
|---|---|
| `POST /api/upload-url` | Get a presigned R2 upload URL for direct client-side upload |
| `POST /api/checkout` | Create a Stripe Checkout session |
| `POST /api/webhook` | Stripe webhook handler (creates Printful order) |
| `GET /api/stripe-session` | Fetch session details for success page |
| `GET /api/catalog` | Product catalog |
| `GET /api/shipping-countries` | Allowed shipping countries |

## Notes

- Variant IDs are resolved from `products.json` at build time (no env vars needed for variants).
- Checkout country allowlist is fetched from Printful by default, with a fallback list if unavailable.
- The Printful integration uses the v2 API with native orientation support.

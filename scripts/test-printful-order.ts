/**
 * Test script: extracts order data from a Stripe webhook body
 * and sends it to the Printful v2 API as a draft order.
 *
 * Usage:
 *   npx tsx scripts/test-printful-order.ts
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRINTFUL_API_KEY = process.env.NUXT_PRINTFUL_API_KEY;
if (!PRINTFUL_API_KEY) {
  console.error("Set NUXT_PRINTFUL_API_KEY env var before running this script.");
  process.exit(1);
}

// Load the webhook body
const webhookPath = resolve(__dirname, "test_webhook_body.json");
const event = JSON.parse(readFileSync(webhookPath, "utf-8"));
const session = event.data.object;
const metadata = session.metadata ?? {};

// Extract shipping from collected_information (new Stripe API) or shipping_details (legacy)
const shipping =
  session.shipping_details ?? session.collected_information?.shipping_details;
const address = shipping?.address;

if (!shipping || !address) {
  console.error("No shipping details found in webhook body.");
  process.exit(1);
}

// Map orientation
function mapOrientation(orientation?: string): "horizontal" | "vertical" | null {
  if (orientation === "landscape") return "horizontal";
  if (orientation === "portrait") return "vertical";
  return null;
}

const orientation = mapOrientation(metadata.orientation);
const variantId = Number(metadata.printfulVariantId);
const customerEmail = session.customer_details?.email ?? "";

const orderBody = {
  external_id: randomUUID().replace(/-/g, ""),
  recipient: {
    name: shipping.name,
    email: customerEmail,
    address1: address.line1,
    address2: address.line2 || undefined,
    city: address.city,
    state_code: address.state || undefined,
    country_code: address.country,
    zip: address.postal_code,
    phone: session.customer_details?.phone || undefined,
  },
  order_items: [
    {
      source: "catalog",
      catalog_variant_id: variantId,
      quantity: 1,
      ...(orientation && { orientation }),
      placements: [
        {
          placement: "default",
          technique: "digital",
          layers: [
            {
              type: "file",
              url: metadata.imageUrl,
            },
          ],
        },
      ],
    },
  ],
};

console.log("=== Sending order to Printful v2 API ===");
console.log(JSON.stringify(orderBody, null, 2));
console.log();

const response = await fetch("https://api.printful.com/v2/orders", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${PRINTFUL_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(orderBody),
});

const data = await response.json();

if (response.ok) {
  console.log("=== Draft order created successfully ===");
  console.log(JSON.stringify(data, null, 2));
} else {
  console.error(`=== Printful API error (${response.status}) ===`);
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

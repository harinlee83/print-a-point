import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { createPrintfulOrder } from "~~/server/utils/printful";
import { getStripeClient } from "~~/server/utils/stripe";

function assertString(value: unknown, fieldName: string): string {
  const text = String(value ?? "").trim();
  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing ${fieldName}`,
    });
  }
  return text;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const stripe = getStripeClient();
  const webhookSecret =
    process.env.NUXT_STRIPE_WEBHOOK_SECRET || config.stripeWebhookSecret;

  const signature = getHeader(event, "stripe-signature");
  if (!signature || !webhookSecret) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing webhook signature configuration",
    });
  }

  const rawBody = await readRawBody(event, false);
  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing webhook body",
    });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Webhook signature invalid",
    });
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return { received: true };
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const imageUrl = assertString(metadata.imageUrl, "metadata.imageUrl");
  const variantId = Number(assertString(metadata.printfulVariantId, "metadata.printfulVariantId"));
  const productTypeId = String(metadata.productTypeId || "poster");

  if (!Number.isFinite(variantId) || variantId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Printful variant id",
    });
  }

  const sessionAny = session as any;
  const shipping = session.shipping_details ?? sessionAny.collected_information?.shipping_details;
  const address = shipping?.address;
  if (!shipping || !address) {
    throw createError({
      statusCode: 400,
      statusMessage: "Stripe session is missing shipping details",
    });
  }

  const customerEmail =
    String(session.customer_details?.email ?? session.customer_email ?? "").trim();

  if (!customerEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "Stripe session is missing customer email",
    });
  }

  const orderData = {
    externalId: randomUUID().replace(/-/g, ""),
    imageUrl,
    variantId,
    productTypeId,
    orientation: String(metadata.orientation || "portrait"),
    quantity: 1,
    email: customerEmail,
    recipient: {
      name: assertString(shipping.name, "shipping_details.name"),
      address1: assertString(address.line1, "shipping_details.address.line1"),
      address2: String(address.line2 ?? "").trim() || undefined,
      city: assertString(address.city, "shipping_details.address.city"),
      stateCode: String(address.state ?? "").trim() || undefined,
      zip: assertString(address.postal_code, "shipping_details.address.postal_code"),
      countryCode: assertString(address.country, "shipping_details.address.country"),
      phone: String(session.customer_details?.phone ?? "").trim() || undefined,
    },
  };

  console.log("[webhook] Order data assembled:", JSON.stringify(orderData, null, 2));

  if (process.env.NUXT_PRINTFUL_MOCK_API === "true") {
    console.log("[webhook] MOCK MODE — skipping Printful API call");
  } else {
    try {
      const result = await createPrintfulOrder(orderData);
      console.log("[webhook] Printful order created:", JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.error("[webhook] Printful API error:", err?.data ?? err?.message ?? err);
      throw createError({
        statusCode: 502,
        statusMessage: `Printful order failed: ${err?.data?.error?.message ?? err?.message ?? "Unknown error"}`,
      });
    }
  }


  return { received: true };
});
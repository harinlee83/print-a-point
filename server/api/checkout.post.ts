import { getServerPosterSizeById } from "~~/server/utils/sizeCatalog";
import { getAllowedCountriesForCheckout } from "~~/server/utils/printful";
import { getStripeClient } from "~~/server/utils/stripe";
import type { H3Event } from "h3";

interface CheckoutRequestBody {
  imageUrl?: string;
  sizeId?: string;
  locationLabel?: string;
  displayCity?: string;
  displayCountry?: string;
  themeId?: string;
}

function resolveBaseUrl(event: H3Event): string {
  const config = useRuntimeConfig();
  const configuredBaseUrl = String(
    process.env.NUXT_PUBLIC_BASE_URL || config.public.baseUrl || "",
  ).trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  const proto =
    getHeader(event, "x-forwarded-proto") ||
    (process.env.NODE_ENV === "development" ? "http" : "https");
  const host = getHeader(event, "x-forwarded-host") || getHeader(event, "host");

  if (!host) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not resolve application base URL",
    });
  }

  return `${proto}://${host}`;
}

export default defineEventHandler(async (event) => {
  const stripe = getStripeClient();
  const body = await readBody<CheckoutRequestBody>(event);

  const imageUrl = String(body.imageUrl ?? "").trim();
  const sizeId = String(body.sizeId ?? "").trim();
  const locationLabel = String(body.locationLabel ?? "").trim();
  const displayCity = String(body.displayCity ?? "").trim();
  const displayCountry = String(body.displayCountry ?? "").trim();
  const themeId = String(body.themeId ?? "").trim();

  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid imageUrl is required",
    });
  }

  const size = getServerPosterSizeById(sizeId, event);
  if (!size) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid sizeId",
    });
  }

  const variantEnvBySize = {
    "18x24": "NUXT_PRINTFUL_VARIANT_18X24",
    "24x36": "NUXT_PRINTFUL_VARIANT_24X36",
    "30x40": "NUXT_PRINTFUL_VARIANT_30X40",
  } as const;

  if (!size.variantId) {
    throw createError({
      statusCode: 500,
      statusMessage: `Printful variant is missing for ${size.label}. Set ${variantEnvBySize[size.id]}.`,
    });
  }

  const allowedCountries = await getAllowedCountriesForCheckout();
  const baseUrl = resolveBaseUrl(event);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_creation: "always",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: size.priceCents,
          product_data: {
            name: `Custom Map Poster - ${size.label}`,
            description:
              "Museum-quality matte print. Printed on demand and shipped by Printful.",
          },
        },
      },
    ],
    shipping_address_collection: {
      allowed_countries: allowedCountries as any,
    },
    phone_number_collection: {
      enabled: true,
    },
    automatic_tax: {
      enabled: true,
    },
    metadata: {
      imageUrl,
      sizeId: size.id,
      sizeLabel: size.label,
      printfulVariantId: String(size.variantId),
      locationLabel,
      displayCity,
      displayCountry,
      themeId,
    },
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/create`,
  });

  if (!session.url) {
    throw createError({
      statusCode: 500,
      statusMessage: "Stripe Checkout URL was not returned",
    });
  }

  return {
    url: session.url,
    id: session.id,
  };
});

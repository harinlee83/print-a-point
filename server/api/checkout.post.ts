import { getServerPosterSizeById, getServerVariant } from "~~/server/utils/sizeCatalog";
import { getAllowedCountriesForCheckout } from "~~/server/utils/printful";
import { getStripeClient } from "~~/server/utils/stripe";
import type { H3Event } from "h3";
import type { ProductTypeId, FrameColorId } from "~~/shared/productCatalog";

interface CheckoutRequestBody {
  imageUrl?: string;
  sizeId?: string;
  productTypeId?: ProductTypeId;
  sizeLabel?: string;
  frameColor?: FrameColorId;
  locationLabel?: string;
  displayCity?: string;
  displayCountry?: string;
  themeId?: string;
  orientation?: string;
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

  // Support new product-type-based checkout
  const productTypeId = body.productTypeId;
  const sizeLabel = String(body.sizeLabel ?? "").trim();
  const frameColor = body.frameColor;

  let variantId: number | null = null;
  let priceCents: number;
  let productName: string;

  if (productTypeId && sizeLabel) {
    // New product catalog flow
    const variant = getServerVariant(productTypeId, sizeLabel, frameColor, event);
    if (!variant) {
      throw createError({
        statusCode: 400,
        statusMessage: `No variant found for ${productTypeId} ${sizeLabel}${frameColor ? ` ${frameColor}` : ""}`,
      });
    }

    variantId = variant.variantId;
    priceCents = variant.priceCents;

    // Build descriptive product name
    const typeLabels: Record<string, string> = {
      poster: "Poster",
      "framed-poster": "Framed Poster",
      canvas: "Canvas",
      "framed-canvas": "Framed Canvas",
    };
    const typeName = typeLabels[productTypeId] ?? "Print";
    const frameSuffix = frameColor ? ` - ${frameColor.charAt(0).toUpperCase() + frameColor.slice(1)} Frame` : "";
    productName = `Custom Map ${typeName} - ${sizeLabel}${frameSuffix}`;

    if (!variantId) {
      throw createError({
        statusCode: 500,
        statusMessage: `Printful variant is not configured for ${productName}. Set the corresponding env var.`,
      });
    }
  } else {
    // Legacy flow: use sizeId
    const sizeId = String(body.sizeId ?? "").trim();
    const size = getServerPosterSizeById(sizeId, event);
    if (!size) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid sizeId",
      });
    }

    variantId = size.variantId;
    priceCents = size.priceCents;
    productName = `Custom Map Poster - ${size.label}`;

    if (!variantId) {
      throw createError({
        statusCode: 500,
        statusMessage: `Printful variant is missing for ${size.label}.`,
      });
    }
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
          unit_amount: priceCents,
          product_data: {
            name: productName,
            description:
              "Museum-quality print. Printed on demand and shipped by Printful.",
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
      enabled: false,
    },
    metadata: {
      imageUrl,
      productTypeId: productTypeId ?? "poster",
      sizeLabel: sizeLabel || productName,
      frameColor: frameColor ?? "",
      printfulVariantId: String(variantId),
      locationLabel,
      displayCity,
      displayCountry,
      themeId,
      orientation: String(body.orientation ?? "portrait"),
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

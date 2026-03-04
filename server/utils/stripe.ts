import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const config = useRuntimeConfig();
  const stripeSecretKey =
    process.env.NUXT_STRIPE_SECRET_KEY || config.stripeSecretKey;
  if (!stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing Stripe configuration",
    });
  }

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  return stripeClient;
}

import { getStripeClient } from "~~/server/utils/stripe";

export default defineEventHandler(async (event) => {
  const stripe = getStripeClient();
  const query = getQuery(event);
  const sessionId = String(query.id ?? "").trim();

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Query parameter id is required",
    });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    id: session.id,
    customerEmail:
      String(session.customer_details?.email ?? session.customer_email ?? "").trim(),
    amountTotal: session.amount_total,
    currency: session.currency,
  };
});

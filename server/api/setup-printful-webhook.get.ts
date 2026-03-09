import { $fetch } from "ofetch";

/**
 * UTILITY SCRIPT: Run this to register your Printful Webhook.
 * 
 * To run this in Nuxt/Nitro environment, you can temporarily 
 * create a server route or use a one-off command if configured.
 * 
 * Alternatively, you can just run this logic inside a temporary 
 * server API route and visit it once in your browser.
 */

const PRINTFUL_API_BASE = "https://api.printful.com";
const WEBHOOK_URL = "https://www.printapoint.com/api/printful-webhook";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const printfulApiKey = process.env.NUXT_PRINTFUL_API_KEY || config.printfulApiKey;

  if (!printfulApiKey) {
    return { error: "Missing Printful API Key" };
  }

  console.log(`[setup-webhook] Registering ${WEBHOOK_URL}...`);

  try {
    const response = await $fetch(`${PRINTFUL_API_BASE}/v2/webhooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${printfulApiKey}`,
        "Content-Type": "application/json",
      },
      body: {
        default_url: WEBHOOK_URL,
        events: [
          { type: "order_updated" },
          { type: "order_failed" }
        ],
      },
    });

    return {
      success: true,
      message: "Printful Webhook Registered successfully",
      details: response
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.data ?? err?.message
    };
  }
});

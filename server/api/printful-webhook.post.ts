import { confirmPrintfulOrder } from "~~/server/utils/printful";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("[printful-webhook] Received event:", JSON.stringify(body, null, 2));

  // Printful Webhook for "order_updated"
  // Docs: https://developers.printful.com/docs/v2-beta/#tag/Webhook-v2
  if (body?.type === "order_updated") {
    const order = body.data?.order;
    const orderId = order?.id;
    const status = order?.status;
    const externalId = order?.external_id;

    // We only care about orders in 'draft' status where costs are now calculated.
    // Printful "order.updated" fires when costs are ready.
    if (orderId && status === "draft") {
      // Check if costs are present (suggests calculation is done)
      const hasCosts = !!(order.costs?.subtotal || order.retail_costs?.subtotal);

      if (hasCosts) {
        console.log(`[printful-webhook] Order ${orderId} (Ext: ${externalId}) is ready for confirmation.`);
        try {
          await confirmPrintfulOrder(orderId);
          return { handled: true, action: "confirmed" };
        } catch (err: any) {
          console.error(`[printful-webhook] Failed to confirm order ${orderId}:`, err?.message);
          // Return 200 anyway so Printful doesn't keep retrying if it's a permanent error
          // or handle it as you prefer.
          return { handled: true, error: err?.message };
        }
      } else {
        console.log(`[printful-webhook] Order ${orderId} updated but costs not ready yet.`);
      }
    }
  }

  return { received: true };
});

import { confirmPrintfulOrder, getPrintfulOrder } from "~~/server/utils/printful";

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
      try {
        const fullOrder = await getPrintfulOrder(orderId);

        const isCalculationDone =
          fullOrder?.costs?.calculation_status === "done" ||
          fullOrder?.retail_costs?.calculation_status === "done";

        if (isCalculationDone) {
          console.log(`[printful-webhook] Order ${orderId} (Ext: ${externalId}) costs calculated. Ready for confirmation.`);
          try {
            await confirmPrintfulOrder(orderId);
            return { handled: true, action: "confirmed" };
          } catch (err: any) {
            console.error(`[printful-webhook] Failed to confirm order ${orderId}:`, err?.message);
            // Return 200 anyway so Printful doesn't keep retrying if it's a permanent error
            return { handled: true, error: err?.message };
          }
        } else {
          console.log(`[printful-webhook] Order ${orderId} updated but costs calculation_status is not 'done' yet.`);
        }
      } catch (err: any) {
        console.error(`[printful-webhook] Failed to fetch full order ${orderId}:`, err?.message);
        return { handled: true, error: "Order fetch failed" };
      }
    }
  }

  return { received: true };
});

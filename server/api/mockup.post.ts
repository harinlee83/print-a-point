export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const apiKey = config.printfulApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Printful API key is not configured",
    });
  }

  const body = await readBody<{
    imageUrl?: string;
    productId?: number;
    variantIds?: number[];
    width?: number;
    height?: number;
  }>(event);

  const imageUrl = String(body.imageUrl ?? "").trim();
  const productId = body.productId;
  const variantIds = body.variantIds ?? [];
  const variantWidth = body.width || 1000;
  const variantHeight = body.height || 1000;

  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid imageUrl is required",
    });
  }

  if (!productId || typeof productId !== "number") {
    throw createError({
      statusCode: 400,
      statusMessage: "productId is required",
    });
  }

  if (!variantIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "At least one variantId is required",
    });
  }

  const result = await $fetch<{ result: { task_key: string } }>(
    `https://api.printful.com/mockup-generator/create-task/${productId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: {
        variant_ids: variantIds,
        format: "jpg",
        width: 1000,
        files: [
          {
            placement: "default",
            image_url: imageUrl,
          },
        ],
      },
    },
  );

  return {
    taskKey: result.result.task_key,
  };
});

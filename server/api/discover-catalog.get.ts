export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const apiKey = config.printfulApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "NUXT_PRINTFUL_API_KEY is not configured",
    });
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  const productsRes = await $fetch<{ result: Array<{ id: number; title: string; type: string }> }>(
    "https://api.printful.com/products",
    { headers },
  );

  const wallArtKeywords = ["poster", "canvas", "framed", "art print", "wall art"];
  const matching = productsRes.result.filter((p) =>
    wallArtKeywords.some((kw) => p.title.toLowerCase().includes(kw)),
  );

  const details = [];

  for (const product of matching) {
    try {
      const detail = await $fetch<{
        result: {
          product: { id: number; title: string; type: string; description: string };
          variants: Array<{
            id: number;
            name: string;
            size: string;
            color: string;
            price: string;
            in_stock: boolean;
          }>;
        };
      }>(`https://api.printful.com/products/${product.id}`, { headers });

      details.push({
        productId: detail.result.product.id,
        title: detail.result.product.title,
        type: detail.result.product.type,
        variants: detail.result.variants.map((v) => ({
          id: v.id,
          name: v.name,
          size: v.size,
          color: v.color,
          price: v.price,
          inStock: v.in_stock,
        })),
      });
    } catch {
      details.push({
        productId: product.id,
        title: product.title,
        error: "Failed to fetch product details",
        variants: [],
      });
    }
  }

  return {
    totalProducts: productsRes.result.length,
    matchingProducts: details.length,
    products: details,
  };
});

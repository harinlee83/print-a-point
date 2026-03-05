export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const apiKey = config.printfulApiKey;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Printful API key is not configured",
    });
  }

  const query = getQuery(event);
  const taskKey = String(query.task_key ?? "").trim();

  if (!taskKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "task_key query parameter is required",
    });
  }

  const result = await $fetch<{
    result: {
      status: string;
      mockups?: Array<{
        placement: string;
        variant_ids: number[];
        mockup_url: string;
        extra: Array<{ title: string; url: string }>;
      }>;
      error?: string;
    };
  }>(
    `https://api.printful.com/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  );

  return {
    status: result.result.status,
    mockups: result.result.mockups ?? [],
    error: result.result.error,
  };
});

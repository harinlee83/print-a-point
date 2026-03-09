interface PrintfulCountry {
  code: string;
  name?: string;
}

const PRINTFUL_API_BASE = "https://api.printful.com";

const FALLBACK_COUNTRIES = [
  "US",
  "CA",
  "GB",
  "IE",
  "DE",
  "FR",
  "ES",
  "IT",
  "NL",
  "BE",
  "CH",
  "AT",
  "SE",
  "NO",
  "DK",
  "FI",
  "PL",
  "CZ",
  "PT",
  "GR",
  "RO",
  "HU",
  "BG",
  "HR",
  "SI",
  "SK",
  "EE",
  "LV",
  "LT",
  "AU",
  "NZ",
  "JP",
  "KR",
  "SG",
  "HK",
  "AE",
  "SA",
  "IL",
  "TR",
  "MX",
  "BR",
  "AR",
  "CL",
  "CO",
  "PE",
  "ZA",
  "IN",
  "TH",
  "MY",
  "PH",
  "ID",
  "VN",
];

function parseCountryCsv(value: string): string[] {
  return String(value ?? "")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter((country) => /^[A-Z]{2}$/.test(country));
}

function uniqueCountryCodes(codes: string[]): string[] {
  return [...new Set(codes)];
}

export async function fetchPrintfulCountries(): Promise<string[]> {
  const config = useRuntimeConfig();
  const printfulApiKey =
    process.env.NUXT_PRINTFUL_API_KEY || config.printfulApiKey;
  if (!printfulApiKey) {
    return [];
  }

  const response = await $fetch<{ result?: PrintfulCountry[] }>(
    `${PRINTFUL_API_BASE}/countries`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${printfulApiKey}`,
      },
    },
  );

  const result = Array.isArray(response?.result) ? response.result : [];

  return uniqueCountryCodes(
    result
      .map((entry) => String(entry.code ?? "").trim().toUpperCase())
      .filter((code) => /^[A-Z]{2}$/.test(code)),
  );
}

export async function getAllowedCountriesForCheckout() {
  const config = useRuntimeConfig();
  const allowedCountries =
    process.env.NUXT_STRIPE_ALLOWED_COUNTRIES || config.allowedCountries;

  const configured = parseCountryCsv(allowedCountries);
  if (configured.length > 0) {
    return configured;
  }

  try {
    const printfulCountries = await fetchPrintfulCountries();
    if (printfulCountries.length > 0) {
      return printfulCountries;
    }
  } catch {
    // Fall through to fallback list.
  }

  return FALLBACK_COUNTRIES;
}

export interface CreatePrintfulOrderInput {
  externalId: string;
  imageUrl: string;
  variantId: number;
  quantity: number;
  email: string;
  recipient: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    stateCode?: string;
    zip: string;
    countryCode: string;
    phone?: string;
  };
  productTypeId?: string;
  orientation?: string;
}

function mapOrientation(orientation?: string): "horizontal" | "vertical" | null {
  if (orientation === "landscape") return "horizontal";
  if (orientation === "portrait") return "vertical";
  return null;
}

export async function createPrintfulOrder(input: CreatePrintfulOrderInput) {
  const config = useRuntimeConfig();
  const printfulApiKey =
    process.env.NUXT_PRINTFUL_API_KEY || config.printfulApiKey;
  if (!printfulApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing Printful API configuration",
    });
  }

  const orientation = mapOrientation(input.orientation);

  const orderResponse = await $fetch<{ data?: { id?: number } }>(
    `${PRINTFUL_API_BASE}/v2/orders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${printfulApiKey}`,
        "Content-Type": "application/json",
      },
      body: {
        external_id: input.externalId,
        recipient: {
          name: input.recipient.name,
          email: input.email,
          address1: input.recipient.address1,
          address2: input.recipient.address2,
          city: input.recipient.city,
          state_code: input.recipient.stateCode,
          country_code: input.recipient.countryCode,
          zip: input.recipient.zip,
          phone: input.recipient.phone,
        },
        order_items: [
          {
            source: "catalog",
            catalog_variant_id: Number(input.variantId),
            quantity: input.quantity,
            ...(orientation && { orientation }),
            placements: [
              {
                placement: "default",
                technique: "digital",
                layers: [
                  {
                    type: "file",
                    url: input.imageUrl,
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  );

  return orderResponse;
}



export async function getPrintfulOrderIdByExternalId(externalId: string): Promise<number | null> {
  const config = useRuntimeConfig();
  const printfulApiKey = process.env.NUXT_PRINTFUL_API_KEY || config.printfulApiKey;

  if (!printfulApiKey) return null;

  try {
    const response = await $fetch<{ data: Array<{ id: number }> }>(
      `${PRINTFUL_API_BASE}/v2/orders?external_id=${externalId}`,
      {
        headers: {
          Authorization: `Bearer ${printfulApiKey}`,
        },
      }
    );
    // API v2 uses `data` array
    return response.data?.[0]?.id ?? null;
  } catch (err) {
    console.error(`[printful] Failed to lookup order by externalId ${externalId}:`, err);
    return null;
  }
}

export async function getPrintfulOrder(orderId: number): Promise<any> {
  const config = useRuntimeConfig();
  const printfulApiKey = process.env.NUXT_PRINTFUL_API_KEY || config.printfulApiKey;

  if (!printfulApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing Printful API configuration",
    });
  }

  try {
    const response = await $fetch<{ data: any }>(
      `${PRINTFUL_API_BASE}/v2/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${printfulApiKey}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error(`[printful] Failed to fetch order ${orderId}:`, err);
    return null;
  }
}

export async function confirmPrintfulOrder(orderId: number) {
  const config = useRuntimeConfig();
  const printfulApiKey =
    process.env.NUXT_PRINTFUL_API_KEY || config.printfulApiKey;

  if (!printfulApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing Printful API configuration",
    });
  }

  try {
    await $fetch(
      `${PRINTFUL_API_BASE}/v2/orders/${orderId}/confirmation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${printfulApiKey}`,
        },
      },
    );
    console.log(`[printful] Order ${orderId} confirmed for fulfillment`);
  } catch (err: any) {
    const msg = err?.data?.error?.message ?? err?.message ?? "";
    if (msg.includes("already confirmed") || msg.includes("already in process")) {
      console.log(`[printful] Order ${orderId} was already confirmed`);
      return;
    }
    throw err;
  }
}

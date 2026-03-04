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
    process.env.NUXT_ALLOWED_COUNTRIES || config.allowedCountries;

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

  return $fetch(`${PRINTFUL_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${printfulApiKey}`,
      "Content-Type": "application/json",
    },
    body: {
      external_id: input.externalId,
      confirm: true,
      update_existing: false,
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
      items: [
        {
          variant_id: Number(input.variantId),
          quantity: input.quantity,
          files: [
            {
              type: "default",
              url: input.imageUrl,
            },
          ],
        },
      ],
    },
  });
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@pinia/nuxt"],

  app: {
    head: {
      title: "PrintAPoint",
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/icons/favicon.svg" },
      ],
      meta: [
        {
          name: "description",
          content: "Turn Coordinates into Art. Create custom map posters from any location.",
        },
      ],
    },
  },

  css: ["~/assets/css/maplibre.css", "~/assets/css/main.css"],

  nitro: {
    preset: process.env.NITRO_PRESET || "vercel",
  },

  runtimeConfig: {
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    printfulApiKey: "",

    cfAccountId: "",
    r2AccessKeyId: "",
    r2SecretAccessKey: "",
    r2BucketName: "",
    r2PublicUrl: "",

    // Legacy poster variant IDs (backward compat)
    printfulVariant18x24: "",
    printfulVariant24x36: "",
    printfulVariant30x40: "",

    // Legacy poster prices (backward compat)
    price18x24: "",
    price24x36: "",
    price30x40: "",

    // Product catalog variant IDs
    // Poster
    printfulVariantPoster18x24: "",
    printfulVariantPoster24x36: "",
    printfulVariantPoster30x40: "",
    // Framed Poster (per frame color)
    printfulVariantFramedPoster18x24_black: "",
    printfulVariantFramedPoster18x24_white: "",
    printfulVariantFramedPoster18x24_walnut: "",
    printfulVariantFramedPoster24x36_black: "",
    printfulVariantFramedPoster24x36_white: "",
    printfulVariantFramedPoster24x36_walnut: "",
    printfulVariantFramedPoster30x40_black: "",
    printfulVariantFramedPoster30x40_white: "",
    printfulVariantFramedPoster30x40_walnut: "",
    // Canvas
    printfulVariantCanvas12x16: "",
    printfulVariantCanvas18x24: "",
    printfulVariantCanvas24x36: "",
    // Framed Canvas (per frame color)
    printfulVariantFramedCanvas12x16_black: "",
    printfulVariantFramedCanvas12x16_white: "",
    printfulVariantFramedCanvas12x16_walnut: "",
    printfulVariantFramedCanvas18x24_black: "",
    printfulVariantFramedCanvas18x24_white: "",
    printfulVariantFramedCanvas18x24_walnut: "",
    printfulVariantFramedCanvas24x36_black: "",
    printfulVariantFramedCanvas24x36_white: "",
    printfulVariantFramedCanvas24x36_walnut: "",

    allowedCountries: "",

    public: {
      stripePublishableKey: "",
      baseUrl: "",
    },
  },
});

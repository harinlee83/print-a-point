// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@pinia/nuxt"],

  app: {
    head: {
      title: "PrintAPoint",
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

    printfulVariant18x24: "",
    printfulVariant24x36: "",
    printfulVariant30x40: "",

    price18x24: "",
    price24x36: "",
    price30x40: "",
    allowedCountries: "",

    public: {
      stripePublishableKey: "",
      baseUrl: "",
    },
  },
});

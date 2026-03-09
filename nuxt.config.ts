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
      script: [
        {
          src: "https://www.googletagmanager.com/gtag/js?id=G-JT3DFDK8FV",
          async: true,
        },
        {
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JT3DFDK8FV');
          `,
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

    allowedCountries: "",

    public: {
      stripePublishableKey: "",
      baseUrl: "",
    },
  },
});

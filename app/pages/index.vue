<template>
  <div class="home-shell">
    <header class="home-nav">
      <div class="home-brand">
        <img src="/icons/printapoint-icon-dark.svg" alt="PrintaPoint" />
        <span>Printa Point</span>
      </div>
    </header>

    <main class="home-main">
      <section class="home-hero">
        <div class="home-hero-copy">
          <h1>Your city, your style, printed.</h1>
          <p class="home-hero-subtext">design completely for free</p>
        </div>

        <NuxtLink class="home-cta" to="/create">Start Designing</NuxtLink>
        <div class="home-carousel" aria-label="Poster sample carousel">
          <div class="home-carousel-track">
            <NuxtLink
              v-for="(item, idx) in carouselItems"
              :key="`${item.src}-${idx}`"
              class="home-carousel-card"
              :to="item.ctaLink"
            >
              <img :src="item.src" :alt="item.alt" />
              <div class="home-carousel-meta">
                <p>{{ item.theme }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>

      </section>

    </main>

    <FooterNote />
  </div>
</template>

<script setup lang="ts">
import FooterNote from "~/components/FooterNote.vue";

const galleryItems = [
  {
    src: "/gallery/tokyo_japanese_ink.jpg",
    alt: "Tokyo Japanese Ink map poster",
    city: "Tokyo",
    theme: "Japanese Ink",
    ctaLink: "/create?theme=japanese_ink&city=Tokyo",
  },
  {
    src: "/gallery/singapore_neon_cyberpunk.jpg",
    alt: "Singapore neon cyberpunk map poster",
    city: "Singapore",
    theme: "Neon Cyberpunk",
    ctaLink: "/create?theme=neon_cyberpunk&city=Singapore",
  },
  {
    src: "/gallery/venice_blueprint.jpg",
    alt: "Venice blueprint map poster",
    city: "Venice",
    theme: "Blueprint",
    ctaLink: "/create?theme=blueprint&city=Venice",
  },
  {
    src: "/gallery/marrakech_terracotta.jpg",
    alt: "Marrakech terracotta map poster",
    city: "Marrakech",
    theme: "Terracotta",
    ctaLink: "/create?theme=terracotta&city=Marrakech",
  },
  {
    src: "/gallery/seattle_emerald.jpg",
    alt: "Seattle emerald map poster",
    city: "Seattle",
    theme: "Emerald",
    ctaLink: "/create?theme=emerald&city=Seattle",
  },
  {
    src: "/gallery/paris_pastel_dream.jpg",
    alt: "Paris pastel dream map poster",
    city: "Paris",
    theme: "Pastel Dream",
    ctaLink: "/create?theme=pastel_dream&city=Paris",
  },
  {
    src: "/gallery/dubai_midnight_blue.jpg",
    alt: "Dubai midnight blue map poster",
    city: "Dubai",
    theme: "Midnight Blue",
    ctaLink: "/create?theme=midnight_blue&city=Dubai",
  },
  {
    src: "/gallery/san_francisco_sunset.jpg",
    alt: "San Francisco sunset map poster",
    city: "San Francisco",
    theme: "Sunset",
    ctaLink: "/create?theme=sunset&city=San%20Francisco",
  },
  {
    src: "/gallery/amsterdam_ocean.jpg",
    alt: "Amsterdam ocean map poster",
    city: "Amsterdam",
    theme: "Ocean",
    ctaLink: "/create?theme=ocean&city=Amsterdam",
  },
  {
    src: "/gallery/melbourne_forest.jpg",
    alt: "Melbourne forest map poster",
    city: "Melbourne",
    theme: "Forest",
    ctaLink: "/create?theme=forest&city=Melbourne",
  },
  {
    src: "/gallery/mumbai_contrast_zones.jpg",
    alt: "Mumbai contrast zones map poster",
    city: "Mumbai",
    theme: "Contrast Zones",
    ctaLink: "/create?theme=contrast_zones&city=Mumbai",
  },
];

const carouselItems = [...galleryItems, ...galleryItems];
</script>

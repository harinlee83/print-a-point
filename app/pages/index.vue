<template>
  <div class="home-shell">
    <header class="home-nav">
      <NuxtLink to="/" class="home-brand">
        <img src="/icons/logo.svg" alt="" />
        <span class="home-brand-text">PRINTAPOINT</span>
      </NuxtLink>
    </header>

    <main class="home-main">
      <div class="home-fold">
      <!-- Carousel row 1 -->
      <div class="home-carousel-section home-carousel-section--top">
        <div class="home-carousel" aria-label="Poster gallery row 1">
          <div class="home-carousel-track">
            <NuxtLink
              v-for="(item, idx) in carouselRow1"
              :key="`r1-${item.src}-${idx}`"
              class="home-carousel-card"
              :to="item.ctaLink"
            >
              <img :src="item.src" :alt="item.alt" loading="eager" />
              <div class="home-carousel-meta">
                <p>{{ item.city }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Headline + CTA between carousels -->
      <section class="home-hero">
        <div class="home-hero-copy">
          <h1>Turn Coordinates<br /><em>into Art</em></h1>
          <p class="home-hero-subtext">unlimited designs completely for free</p>
        </div>
        <NuxtLink class="home-cta" to="/create">Start Designing</NuxtLink>
      </section>

      <!-- Carousel row 2 -->
      <div class="home-carousel-section">
        <div class="home-carousel home-carousel--reverse" aria-label="Poster gallery row 2">
          <div class="home-carousel-track home-carousel-track--reverse">
            <NuxtLink
              v-for="(item, idx) in carouselRow2"
              :key="`r2-${item.src}-${idx}`"
              class="home-carousel-card"
              :to="item.ctaLink"
            >
              <img :src="item.src" :alt="item.alt" loading="eager" />
              <div class="home-carousel-meta">
                <p>{{ item.city }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
      </div>

      <!-- FAQ -->
      <FaqSection />

      <!-- Bottom CTA -->
      <section class="home-bottom">
        <p>Museum-quality prints. Shipped worldwide. Powered by Printful.</p>
        <NuxtLink class="home-cta" to="/create">Create Your Map</NuxtLink>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const galleryItems = [
  {
    src: "/gallery/tokyo_japanese_ink.png",
    alt: "Tokyo Japanese Ink map poster",
    city: "Tokyo",
    theme: "Japanese Ink",
    ctaLink: "/create?theme=japanese_ink&city=Tokyo",
  },
  {
    src: "/gallery/singapore_neon_cyberpunk.png",
    alt: "Singapore neon cyberpunk map poster",
    city: "Singapore",
    theme: "Neon Cyberpunk",
    ctaLink: "/create?theme=neon_cyberpunk&city=Singapore",
  },
  {
    src: "/gallery/venice_blueprint.png",
    alt: "Venice blueprint map poster",
    city: "Venice",
    theme: "Blueprint",
    ctaLink: "/create?theme=blueprint&city=Venice",
  },
  {
    src: "/gallery/seoul_terracotta.png",
    alt: "Seoul terracotta map poster",
    city: "Seoul",
    theme: "Terracotta",
    ctaLink: "/create?theme=terracotta&city=Seoul",
  },
  {
    src: "/gallery/seattle_emerald.png",
    alt: "Seattle emerald map poster",
    city: "Seattle",
    theme: "Emerald",
    ctaLink: "/create?theme=emerald&city=Seattle",
  },
  {
    src: "/gallery/paris_pastel_dream.png",
    alt: "Paris pastel dream map poster",
    city: "Paris",
    theme: "Pastel Dream",
    ctaLink: "/create?theme=pastel_dream&city=Paris",
  },
  {
    src: "/gallery/dubai_midnight_blue.png",
    alt: "Dubai midnight blue map poster",
    city: "Dubai",
    theme: "Midnight Blue",
    ctaLink: "/create?theme=midnight_blue&city=Dubai",
  },
  {
    src: "/gallery/san_francisco_sunset.png",
    alt: "San Francisco sunset map poster",
    city: "San Francisco",
    theme: "Sunset",
    ctaLink: "/create?theme=sunset&city=San%20Francisco",
  },
  {
    src: "/gallery/amsterdam_ocean.png",
    alt: "Amsterdam ocean map poster",
    city: "Amsterdam",
    theme: "Ocean",
    ctaLink: "/create?theme=ocean&city=Amsterdam",
  },
  {
    src: "/gallery/melbourne_forest.png",
    alt: "Melbourne forest map poster",
    city: "Melbourne",
    theme: "Forest",
    ctaLink: "/create?theme=forest&city=Melbourne",
  },
  {
    src: "/gallery/mumbai_contrast_zones.png",
    alt: "Mumbai contrast zones map poster",
    city: "Mumbai",
    theme: "Contrast Zones",
    ctaLink: "/create?theme=contrast_zones&city=Mumbai",
  },
  {
    src: "/gallery/new_york_noir.png",
    alt: "New York noir map poster",
    city: "New York",
    theme: "Noir",
    ctaLink: "/create?theme=noir&city=New%20York",
  },
  {
    src: "/gallery/barcelona_terracotta.png",
    alt: "Barcelona terracotta map poster",
    city: "Barcelona",
    theme: "Terracotta",
    ctaLink: "/create?theme=terracotta&city=Barcelona",
  },
  {
    src: "/gallery/cairo_ruby.png",
    alt: "Cairo ruby map poster",
    city: "Cairo",
    theme: "Ruby",
    ctaLink: "/create?theme=ruby&city=Cairo",
  },
  {
    src: "/gallery/shanghai_sage.png",
    alt: "Shanghai sage map poster",
    city: "Shanghai",
    theme: "Sage",
    ctaLink: "/create?theme=sage&city=Shanghai",
  },
  {
    src: "/gallery/sydney_heatwave.png",
    alt: "Sydney heatwave map poster",
    city: "Sydney",
    theme: "Heatwave",
    ctaLink: "/create?theme=heatwave&city=Sydney",
  },
];

// Split gallery into two rows for the double carousel
const mid = Math.ceil(galleryItems.length / 2);
const row1Items = galleryItems.slice(0, mid);
const row2Items = galleryItems.slice(mid);

// Triplicate for seamless loop on wide screens
const carouselRow1 = [...row1Items, ...row1Items, ...row1Items];
const carouselRow2 = [...row2Items, ...row2Items, ...row2Items];
</script>

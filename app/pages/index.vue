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
          <p class="home-hero-subtext">Design unlimited maps for free</p>
        </div>
        <NuxtLink class="home-cta" to="/create">Create Your Map</NuxtLink>
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

      <div class="home-divider-wrapper">
        <hr class="home-divider" />
      </div>

      <!-- Lifestyle Mockups -->
      <section class="home-mockups">
        <div class="home-mockups-header animate-on-scroll animate-on-scroll--up">
          <h2>Museum-Quality<br /><em>Map Prints</em></h2>
          <p>Custom city maps designed to elevate any space</p>
        </div>
        <div class="home-mockups-grid">
          <NuxtLink 
            v-for="(img, idx) in mockupImages" 
            :key="idx" 
            :class="`mockup-card mockup-card--${idx} animate-on-scroll animate-on-scroll--stagger-${idx}`"
            :to="img.ctaLink"
          >
            <div class="mockup-img-wrapper">
              <img :src="img.src" :alt="img.alt" loading="lazy" />
            </div>
            <div class="mockup-caption">
              <p class="mockup-caption-title">{{ img.captionTitle }}</p>
              <p class="mockup-caption-sub">{{ img.captionSub }}</p>
            </div>
          </NuxtLink>
        </div>
      </section>

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
import { useIntersectionObserver } from '~/composables/useIntersectionObserver';

useIntersectionObserver();

const galleryItems = [
  {
    src: "/gallery/tokyo_japanese_ink.webp",
    alt: "Tokyo Japanese Ink map poster",
    city: "Tokyo",
    theme: "Japanese Ink",
    ctaLink: "/create?theme=japanese_ink&city=Tokyo",
  },
  {
    src: "/gallery/singapore_neon_cyberpunk.webp",
    alt: "Singapore neon cyberpunk map poster",
    city: "Singapore",
    theme: "Neon Cyberpunk",
    ctaLink: "/create?theme=neon_cyberpunk&city=Singapore",
  },
  {
    src: "/gallery/venice_blueprint.webp",
    alt: "Venice blueprint map poster",
    city: "Venice",
    theme: "Blueprint",
    ctaLink: "/create?theme=blueprint&city=Venice",
  },
  {
    src: "/gallery/seoul_terracotta.webp",
    alt: "Seoul terracotta map poster",
    city: "Seoul",
    theme: "Terracotta",
    ctaLink: "/create?theme=terracotta&city=Seoul",
  },
  {
    src: "/gallery/seattle_emerald.webp",
    alt: "Seattle emerald map poster",
    city: "Seattle",
    theme: "Emerald",
    ctaLink: "/create?theme=emerald&city=Seattle",
  },
  {
    src: "/gallery/paris_pastel_dream.webp",
    alt: "Paris pastel dream map poster",
    city: "Paris",
    theme: "Pastel Dream",
    ctaLink: "/create?theme=pastel_dream&city=Paris",
  },
  {
    src: "/gallery/dubai_midnight_blue.webp",
    alt: "Dubai midnight blue map poster",
    city: "Dubai",
    theme: "Midnight Blue",
    ctaLink: "/create?theme=midnight_blue&city=Dubai",
  },
  {
    src: "/gallery/san_francisco_sunset.webp",
    alt: "San Francisco sunset map poster",
    city: "San Francisco",
    theme: "Sunset",
    ctaLink: "/create?theme=sunset&city=San%20Francisco",
  },
  {
    src: "/gallery/amsterdam_ocean.webp",
    alt: "Amsterdam ocean map poster",
    city: "Amsterdam",
    theme: "Ocean",
    ctaLink: "/create?theme=ocean&city=Amsterdam",
  },
  {
    src: "/gallery/melbourne_forest.webp",
    alt: "Melbourne forest map poster",
    city: "Melbourne",
    theme: "Forest",
    ctaLink: "/create?theme=forest&city=Melbourne",
  },
  {
    src: "/gallery/mumbai_contrast_zones.webp",
    alt: "Mumbai contrast zones map poster",
    city: "Mumbai",
    theme: "Contrast Zones",
    ctaLink: "/create?theme=contrast_zones&city=Mumbai",
  },
  {
    src: "/gallery/new_york_noir.webp",
    alt: "New York noir map poster",
    city: "New York",
    theme: "Noir",
    ctaLink: "/create?theme=noir&city=New%20York",
  },
  {
    src: "/gallery/barcelona_terracotta.webp",
    alt: "Barcelona terracotta map poster",
    city: "Barcelona",
    theme: "Terracotta",
    ctaLink: "/create?theme=terracotta&city=Barcelona",
  },
  {
    src: "/gallery/cairo_ruby.webp",
    alt: "Cairo ruby map poster",
    city: "Cairo",
    theme: "Ruby",
    ctaLink: "/create?theme=ruby&city=Cairo",
  },
  {
    src: "/gallery/shanghai_sage.webp",
    alt: "Shanghai sage map poster",
    city: "Shanghai",
    theme: "Sage",
    ctaLink: "/create?theme=sage&city=Shanghai",
  },
  {
    src: "/gallery/sydney_heatwave.webp",
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

const mockupImages = [
  { src: "/mockups/tokyo_mockup.webp", alt: "Tokyo framed map mockup", ctaLink: "/create?theme=japanese_ink&city=Tokyo", captionTitle: "Tokyo, Japan", captionSub: "Japanese Ink" },
  { src: "/mockups/seoul_mockup.webp", alt: "Seoul framed map mockup", ctaLink: "/create?theme=terracotta&city=Seoul", captionTitle: "Seoul, South Korea", captionSub: "Terracotta" },
  { src: "/mockups/new_york_mockup.webp", alt: "New York framed map mockup", ctaLink: "/create?theme=noir&city=New%20York", captionTitle: "New York, USA", captionSub: "Noir" },
  { src: "/mockups/amsterdam_mockup.webp", alt: "Amsterdam framed map mockup", ctaLink: "/create?theme=ocean&city=Amsterdam", captionTitle: "Amsterdam, Netherlands", captionSub: "Ocean" },
  { src: "/mockups/dubai_mockup.webp", alt: "Dubai framed map mockup", ctaLink: "/create?theme=midnight_blue&city=Dubai", captionTitle: "Dubai, UAE", captionSub: "Midnight Blue" },
];
</script>

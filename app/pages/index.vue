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
        <!-- Gallery row 1 (top 50%) -->
        <div class="home-fold-row home-fold-row--top">
          <div class="home-fold-row-overlay"></div>
          <div class="home-carousel" aria-label="Poster gallery row 1">
            <div class="home-carousel-track">
              <NuxtLink
                v-for="(item, idx) in carouselRow1"
                :key="`r1-${item.src}-${idx}`"
                class="home-carousel-card"
                :to="item.ctaLink"
              >
                <img :src="item.src" :alt="item.alt" loading="eager" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Gallery row 2 (bottom 50%) -->
        <div class="home-fold-row home-fold-row--bottom">
          <div class="home-fold-row-overlay"></div>
          <div class="home-carousel home-carousel--reverse" aria-label="Poster gallery row 2">
            <div class="home-carousel-track home-carousel-track--reverse">
              <NuxtLink
                v-for="(item, idx) in carouselRow2"
                :key="`r2-${item.src}-${idx}`"
                class="home-carousel-card"
                :to="item.ctaLink"
              >
                <img :src="item.src" :alt="item.alt" loading="eager" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Floating hero text + CTA -->
        <section class="home-hero">
          <div class="home-hero-glass"></div>
          <div class="home-hero-content">
            <h1>Turn Coordinates<br /><em>into Art</em></h1>
            <p class="home-hero-subtext">Design unlimited high-resolution maps for free</p>
            <NuxtLink class="home-cta" to="/create">Create Your Map</NuxtLink>
          </div>
        </section>
      </div>

      <div class="home-divider-wrapper">
        <hr class="home-divider" />
      </div>

      <!-- Lifestyle Mockups -->
      <section class="home-mockups">
        <div class="home-mockups-header">
          <h2>Museum-Quality<br /><em>Map Prints</em></h2>
          <p>Custom city maps designed to elevate any space</p>
        </div>
        <div class="home-mockups-grid">
          <NuxtLink 
            v-for="(img, idx) in mockupImages" 
            :key="idx" 
            :class="`mockup-card mockup-card--${idx}`"
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

      <div class="home-divider-wrapper">
        <hr class="home-divider" />
      </div>

      <!-- How It Works -->
      <section class="home-steps">
        <div class="home-steps-header">
          <h2>Create Your Map<br /><em>in Minutes</em></h2>
        </div>
        <div class="home-steps-grid">
          <div class="home-step">
            <span class="home-step-number">01</span>
            <h3>Choose Your Location</h3>
            <p>Enter a city, address, or coordinates.</p>
          </div>
          <div class="home-step">
            <span class="home-step-number">02</span>
            <h3>Customize Your Style</h3>
            <p>Pick colors, labels, and layout.</p>
          </div>
          <div class="home-step">
            <span class="home-step-number">03</span>
            <h3>Download or Print</h3>
            <p>Get a high-resolution poster ready to frame.</p>
          </div>
        </div>
      </section>

      <div class="home-divider-wrapper">
        <hr class="home-divider" />
      </div>

      <!-- FAQ -->
      <FaqSection />

      <!-- Bottom CTA -->
      <section class="home-bottom">
        <h2>Start Creating <em>Today</em></h2>
        <div class="home-bottom-trust">
          <span>Real Map Data</span>
          <span>Custom Styling</span>
          <span>Secure Payment by Stripe</span>
          <span>Reliable Shipping by Printful</span>
        </div>
        <NuxtLink class="home-cta" to="/create">Create Your Map</NuxtLink>
      </section>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <NuxtLink to="/" class="footer-logo">
            <img src="/icons/logo.svg" alt="" />
            <span>PRINTAPOINT</span>
          </NuxtLink>
          <p class="footer-copyright">&copy; {{ new Date().getFullYear() }} Printapoint. All rights reserved.</p>
        </div>

        <div class="footer-links">
          <NuxtLink to="/privacy">Privacy Policy</NuxtLink>
          <NuxtLink to="/cookies">Cookie Policy</NuxtLink>
          <NuxtLink to="/terms">Terms of Service</NuxtLink>
        </div>

        <div class="footer-social">
          <a href="#" aria-label="X (Twitter)" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="#" aria-label="Instagram" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
          </a>
          <a href="#" aria-label="Facebook" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>

        <div class="footer-powered">
          <span class="footer-powered-label">Powered by</span>
          <a href="https://stripe.com" target="_blank" rel="noopener" aria-label="Stripe">
            <img src="/icons/stripe.svg" alt="Stripe" class="footer-partner-logo" />
          </a>
          <a href="https://www.printful.com" target="_blank" rel="noopener" aria-label="Printful">
            <img src="/icons/printful.svg" alt="Printful" class="footer-partner-logo" />
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
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

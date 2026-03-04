<template>
  <div class="app-shell">
    <header class="create-header">
      <NuxtLink to="/" class="create-back" aria-label="Back to home">←</NuxtLink>
      <NuxtLink to="/" class="create-brand">
        <img src="/icons/printapoint-icon-dark.svg" alt="PrintaPoint" />
        <span>Printa Point</span>
      </NuxtLink>
      <div class="create-header-end"></div>
    </header>

    <main class="app-grid">
      <PosterPreview
        ref="previewRef"
        @map-ready="onMapReady"
      />
      <CustomizerPanel
        @buy="startCheckout"
        @location-selected="handleLocationSelected"
      />
    </main>

    <FooterNote />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { Map as MapLibreMap } from "maplibre-gl";
import FooterNote from "~/components/FooterNote.vue";
import CustomizerPanel from "~/components/CustomizerPanel.vue";
import PosterPreview from "~/components/PosterPreview.vue";
import { useMapStore } from "~/stores/map";
import { useExport } from "~/composables/useExport";
import { reverseGeocode, searchLocations } from "~/lib/location/nominatim";
import { themeNames } from "~/lib/theme/themeRepository";

const store = useMapStore();
const route = useRoute();
const previewRef = ref<InstanceType<typeof PosterPreview> | null>(null);
const mapRef = ref<MapLibreMap | null>(null);

const { exportMapPng } = useExport(mapRef);

const onMapReady = (map: MapLibreMap) => {
  mapRef.value = map;
};

const handleLocationSelected = (lat: number, lon: number) => {
  previewRef.value?.flyTo(lat, lon);
};

const startCheckout = async () => {
  if (store.isCheckoutLoading || store.isExporting) {
    return;
  }

  store.clearError();
  store.setIsCheckoutLoading(true);

  try {
    const { blob, filename } = await exportMapPng();

    const formData = new FormData();
    formData.append("file", blob, filename);

    const uploadResponse = await $fetch<{ url: string }>("/api/upload", {
      method: "POST",
      body: formData,
    });

    const checkoutResponse = await $fetch<{ url: string }>("/api/checkout", {
      method: "POST",
      body: {
        imageUrl: uploadResponse.url,
        sizeId: store.selectedSizeId,
        locationLabel: store.location,
        displayCity: store.displayCity,
        displayCountry: store.displayCountry,
        themeId: store.selectedThemeId,
      },
    });

    if (!checkoutResponse.url) {
      throw new Error("Checkout URL was not returned.");
    }

    window.location.href = checkoutResponse.url;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start checkout. Please try again.";
    store.setError(message);
  } finally {
    store.setIsCheckoutLoading(false);
  }
};

async function applyQueryPreset() {
  const theme = String(route.query.theme ?? "").trim();
  const city = String(route.query.city ?? "").trim();

  if (theme && themeNames.includes(theme)) {
    store.setTheme(theme);
  }

  if (city.length >= 2) {
    try {
      const results = await searchLocations(city, 1);
      if (results.length > 0) {
        const top = results[0];
        store.applyLocationResult(top);
        previewRef.value?.flyTo(top.lat, top.lon);
      }
    } catch {
      // Ignore preset lookup failures.
    }
  }
}

onMounted(async () => {
  await store.hydrateFromGeolocation(reverseGeocode);
  await applyQueryPreset();
});

watch(
  () => route.fullPath,
  () => {
    void applyQueryPreset();
  },
);
</script>

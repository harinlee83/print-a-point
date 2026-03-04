<template>
  <div class="app-shell">
    <header class="create-header">
      <NuxtLink to="/" class="create-back" aria-label="Back to home">←</NuxtLink>
      <NuxtLink to="/" class="create-brand">
        <img src="/icons/logo.svg" alt="" />
        <span class="create-brand-text">PRINTAPOINT</span>
      </NuxtLink>
      <div class="create-header-end"></div>
    </header>

    <main class="app-grid">
      <PosterPreview
        ref="previewRef"
        @map-ready="onMapReady"
      />
      <PreviewModal
        :open="previewModalOpen"
        :image-url="previewImageUrl"
        @close="closePreviewModal"
      />
      <CustomizerPanel
        :share-copied="shareCopied"
        @buy="startCheckout"
        @location-selected="handleLocationSelected"
        @download-png="handleDownloadPng"
        @download-svg="handleDownloadSvg"
        @share="handleShare"
        @show-preview="openPreviewModal"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { Map as MapLibreMap } from "maplibre-gl";
import CustomizerPanel from "~/components/CustomizerPanel.vue";
import PosterPreview from "~/components/PosterPreview.vue";
import PreviewModal from "~/components/PreviewModal.vue";
import { useMapStore } from "~/stores/map";
import { useExport } from "~/composables/useExport";
import { useShareConfig } from "~/composables/useShareConfig";
import { reverseGeocode, searchLocations } from "~/lib/location/nominatim";
import { themeNames } from "~/lib/theme/themeRepository";

const store = useMapStore();
const route = useRoute();
const { copyShareUrl, applyFromUrl } = useShareConfig();
const previewRef = ref<InstanceType<typeof PosterPreview> | null>(null);
const mapRef = ref<MapLibreMap | null>(null);

const { exportMapPng, downloadPng, downloadSvg } = useExport(mapRef);

const onMapReady = (map: MapLibreMap) => {
  mapRef.value = map;
};

const handleLocationSelected = (lat: number, lon: number) => {
  previewRef.value?.flyTo(lat, lon);
};

const handleDownloadPng = () => {
  void downloadPng();
};

const handleDownloadSvg = () => {
  void downloadSvg();
};

const shareCopied = ref(false);
const previewModalOpen = ref(false);
const previewImageUrl = ref<string | null>(null);

const openPreviewModal = async () => {
  try {
    const { blob } = await exportMapPng();
    const url = URL.createObjectURL(blob);
    previewImageUrl.value = url;
    previewModalOpen.value = true;
  } catch (err) {
    store.setError(err instanceof Error ? err.message : "Could not generate preview.");
  }
};

const closePreviewModal = () => {
  previewModalOpen.value = false;
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value);
    previewImageUrl.value = null;
  }
};

const handleShare = async () => {
  const ok = await copyShareUrl();
  if (ok) {
    shareCopied.value = true;
    store.clearError();
    setTimeout(() => {
      shareCopied.value = false;
    }, 2000);
  } else {
    store.setError("Could not copy link. Please try again.");
  }
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
  applyFromUrl();

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

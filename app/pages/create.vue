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

    <main class="app-main">
      <CustomizerPanel
        :share-copied="shareCopied"
        :is-preparing-print="isPreparingPrint"
        @location-selected="handleLocationSelected"
        @download-png="handleDownloadPng"
        @download-svg="handleDownloadSvg"
        @download-all-png="handleDownloadAllPng"
        @download-all-svg="handleDownloadAllSvg"
        @share="handleShare"
        @preview-print="handlePreviewPrint"
      >
        <PosterPreview
          ref="previewRef"
          @map-ready="onMapReady"
        />
      </CustomizerPanel>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { Map as MapLibreMap } from "maplibre-gl";
import CustomizerPanel from "~/components/CustomizerPanel.vue";
import PosterPreview from "~/components/PosterPreview.vue";
import { useMapStore } from "~/stores/map";
import { useExport } from "~/composables/useExport";
import { useShareConfig } from "~/composables/useShareConfig";
import { reverseGeocode, searchLocations } from "~/lib/location/nominatim";
import { themeNames } from "~/lib/theme/themeRepository";

const store = useMapStore();
const route = useRoute();
const router = useRouter();
const { copyShareUrl, applyFromUrl } = useShareConfig();
const previewRef = ref<InstanceType<typeof PosterPreview> | null>(null);
const mapRef = ref<MapLibreMap | null>(null);

const { exportMapPng, downloadPng, downloadSvg, downloadAllPngs, downloadAllSvgs, preparePrintPreview } = useExport(mapRef);

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

const handleDownloadAllPng = () => {
  void downloadAllPngs();
};

const handleDownloadAllSvg = () => {
  void downloadAllSvgs();
};

const shareCopied = ref(false);

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

const isPreparingPrint = ref(false);

const handlePreviewPrint = async () => {
  isPreparingPrint.value = true;
  try {
    await preparePrintPreview();
    router.push("/print");
  } catch (err) {
    // Error is already handled/shown by store
  } finally {
    isPreparingPrint.value = false;
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

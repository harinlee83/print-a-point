<template>
  <section class="preview-panel">
    <div class="poster-viewport">
      <div
        ref="frameRef"
        class="poster-frame"
        :style="{
          '--poster-aspect': `${store.aspectRatio}`,
          '--poster-bg': posterBgColor,
        }"
      >
        <div
          class="map-shape-container"
          :style="{
            clipPath: computedClipPath,
          }"
        >
          <ClientOnly>
            <MapCanvas
              :style="store.mapStyle"
              :center="mapCenter"
              :zoom="mapZoom"
              :interactive="isEditing"
              :min-zoom="mapMinZoom"
              :max-zoom="mapMaxZoom"
              :overzoom-scale="MAP_OVERZOOM_SCALE"
              @ready="onMapReady"
              @move="onMove"
              @moveend="onMoveEnd"
            />
          </ClientOnly>
          <GradientFades v-if="isNoneShape" :color="store.effectiveTheme.ui.bg" />
        </div>
        <PosterPin
          :show="store.showPin"
          :style-id="store.pinStyleId"
          :color="store.effectivePinColor"
          :size="store.pinSize"
        />
        <PosterTextOverlay
          :city="cityLabel"
          :country="countryLabel"
          :lat="store.latitude"
          :lon="store.longitude"
          :font-family="store.fontFamily"
          :text-color="store.effectiveTheme.ui.text"
          :show-title="store.showTitle"
          :show-divider="store.showDivider"
          :show-subtitle="store.showSubtitle"
          :show-coordinates="store.showCoordinates"
          :text-preset-id="store.textPresetId"
          :map-shape-id="store.mapShape"
          :coordinates="store.displayCoordinates"
        />
        <p class="poster-watermark" :style="{ color: store.effectiveTheme.ui.text }">
          Made with printapoint.com
        </p>
      </div>
    </div>

    <section class="map-controls-section" aria-label="Map controls">
      <div class="map-controls">
        <div class="map-control-group">
          <button
            type="button"
            :class="['map-control-btn', { 'map-control-btn--primary': !isEditing }]"
            @click="isEditing ? handleFinishEditing() : handleStartEditing()"
          >
            {{ isEditing ? 'Finish Editing' : 'Edit Map' }}
          </button>
        </div>
        <p class="map-control-hint">
          {{ isEditing ? 'Drag to move, scroll or pinch to zoom.' : 'Map is locked to prevent unintended movement.' }}
        </p>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { Map as MapLibreMap } from "maplibre-gl";
import MapCanvas from "~/components/MapCanvas.vue";
import GradientFades from "~/components/GradientFades.vue";
import PosterPin from "~/components/PosterPin.vue";
import PosterTextOverlay from "~/components/PosterTextOverlay.vue";
import { useMapStore } from "~/stores/map";
import { useMapSync } from "~/composables/useMapSync";
import { MAP_BUTTON_ZOOM_DURATION_MS, MAP_OVERZOOM_SCALE } from "~/lib/map/constants";
import { ensureGoogleFont } from "~/lib/utils/fonts";
import { resolveMapShape } from "~/lib/shapes/mapShapes";

const COUNTRY_VIEW_ZOOM_LEVEL = 10;
const CONTINENT_VIEW_ZOOM_LEVEL = 6;

const emit = defineEmits<{
  "map-ready": [map: MapLibreMap];
}>();

const store = useMapStore();

const mapRef = ref<MapLibreMap | null>(null);
const frameRef = ref<HTMLDivElement | null>(null);
const isEditing = ref(false);

const {
  mapCenter,
  mapZoom,
  mapMinZoom,
  mapMaxZoom,
  handleMove,
  handleMoveEnd,
  flyToLocation,
  setContainerWidth,
} = useMapSync(mapRef);

const activeShape = computed(() => resolveMapShape(store.mapShape));
const isNoneShape = computed(() => store.mapShape === "none");
const posterBgColor = computed(() => {
  if (!isNoneShape.value && store.shapeBackgroundColor) {
    return store.shapeBackgroundColor;
  }
  return store.effectiveTheme.ui.bg;
});

const isCityCountryView = computed(() => mapZoom.value >= COUNTRY_VIEW_ZOOM_LEVEL);
const isCountryContinentView = computed(
  () => mapZoom.value >= CONTINENT_VIEW_ZOOM_LEVEL && mapZoom.value < COUNTRY_VIEW_ZOOM_LEVEL,
);

const cityLabel = computed(() => {
  if (isCityCountryView.value) {
    return store.displayCity || store.location || "Hanover";
  }
  if (isCountryContinentView.value) {
    return store.displayCountry || "Germany";
  }
  return store.displayContinent || "Earth";
});

const countryLabel = computed(() => {
  if (isCityCountryView.value) {
    return store.displayCountry || "Germany";
  }
  if (isCountryContinentView.value) {
    return store.displayContinent || "Europe";
  }
  return "Earth";
});

const frameWidth = ref(0);
const frameHeight = ref(0);

const computedClipPath = computed(() => {
  const shape = activeShape.value;
  if (shape.cssClipPath === "none") return undefined;
  // Heart needs dynamic path() to preserve aspect ratio on any poster size
  if (shape.cssClipPath === "heart" && frameWidth.value > 0 && frameHeight.value > 0) {
    return generateHeartCssPath(frameWidth.value, frameHeight.value);
  }
  return shape.cssClipPath;
});

function generateHeartCssPath(fw: number, fh: number): string {
  // heart-icon.svg viewBox 0 0 122.88 107.41
  const ar = 122.88 / 107.41;
  const hw = fw * 0.84;
  const hh = Math.min(hw / ar, fh * 0.60);
  const finalW = hh * ar;
  const ox = (fw - finalW) / 2;
  const oy = fh * 0.10;
  const sx = (x: number) => ox + (x / 122.88) * finalW;
  const sy = (y: number) => oy + (y / 107.41) * hh;

  return `path('M${sx(60.83)} ${sy(17.19)} C${sx(68.84)} ${sy(8.84)} ${sx(74.45)} ${sy(1.62)} ${sx(86.79)} ${sy(0.21)} C${sx(109.96)} ${sy(-2.45)} ${sx(131.27)} ${sy(21.27)} ${sx(119.57)} ${sy(44.62)} C${sx(116.24)} ${sy(51.27)} ${sx(109.46)} ${sy(59.18)} ${sx(101.96)} ${sy(66.94)} C${sx(93.73)} ${sy(75.46)} ${sx(84.62)} ${sy(83.81)} ${sx(78.24)} ${sy(90.14)} L${sx(60.84)} ${sy(107.40)} L${sx(46.46)} ${sy(93.56)} C${sx(29.16)} ${sy(76.9)} ${sx(0.95)} ${sy(55.93)} ${sx(0.02)} ${sy(29.95)} C${sx(-0.63)} ${sy(11.75)} ${sx(13.73)} ${sy(0.09)} ${sx(30.25)} ${sy(0.3)} C${sx(45.01)} ${sy(0.5)} ${sx(51.22)} ${sy(7.84)} ${sx(60.83)} ${sy(17.19)}Z')`;
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!import.meta.client) return;

  if (!frameRef.value) return;

  resizeObserver = new ResizeObserver((entries) => {
    if (!entries.length) return;
    const rect = entries[0].contentRect;
    setContainerWidth(rect.width);
    frameWidth.value = rect.width;
    frameHeight.value = rect.height;
  });

  resizeObserver.observe(frameRef.value);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

watch(
  () => store.fontFamily,
  async (family) => {
    if (!family.trim()) return;
    try {
      await ensureGoogleFont(family.trim());
    } catch {
      // Ignore font loading failures; fallback stack remains in place.
    }
  },
  { immediate: true },
);

const onMapReady = (map: MapLibreMap) => {
  mapRef.value = map;
  emit("map-ready", map);
};

const onMove = async (center: [number, number], _zoom: number) => {
  await handleMove(center);
};

const onMoveEnd = async (center: [number, number], zoom: number) => {
  await handleMoveEnd(center, zoom);
};

const handleStartEditing = () => {
  isEditing.value = true;
};

const handleFinishEditing = () => {
  isEditing.value = false;
};

watch(
  () => store.mapBearing,
  (bearing) => {
    if (!mapRef.value) return;
    mapRef.value.rotateTo(bearing, { duration: MAP_BUTTON_ZOOM_DURATION_MS });
  },
);

const getMap = () => mapRef.value;
const flyTo = (lat: number, lon: number) => {
  flyToLocation(lat, lon);
};

defineExpose({
  getMap,
  flyTo,
});
</script>

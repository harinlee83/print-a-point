<template>
  <section class="preview-panel">
    <div class="poster-viewport">
      <div
        ref="frameRef"
        class="poster-frame"
        :style="{
          '--poster-aspect': `${store.aspectRatio}`,
          '--poster-bg': store.effectiveTheme.ui.bg,
        }"
      >
        <ClientOnly>
          <MapCanvas
            :style="store.mapStyle"
            :center="mapCenter"
            :zoom="mapZoom"
            :interactive="isEditing"
            :allow-rotation="isEditing && isRotationEnabled"
            :min-zoom="mapMinZoom"
            :max-zoom="mapMaxZoom"
            :overzoom-scale="MAP_OVERZOOM_SCALE"
            @ready="onMapReady"
            @move="onMove"
            @moveend="onMoveEnd"
          />
        </ClientOnly>
        <GradientFades :color="store.effectiveTheme.ui.bg" />
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
          :show-poster-text="store.showPosterText"
        />
        <p class="poster-watermark" :style="{ color: store.effectiveTheme.ui.text }">
          Made with printapoint.com
        </p>
      </div>
    </div>

    <section class="map-controls-section" aria-label="Map controls">
      <div class="map-controls">
        <template v-if="!isEditing">
          <div class="map-control-group">
            <button type="button" class="map-control-btn" @click="handleRecenter">
              Recenter
            </button>
            <button
              type="button"
              class="map-control-btn map-control-btn--primary"
              @click="handleStartEditing"
            >
              Edit Map
            </button>
          </div>
          <p class="map-control-hint">Map is locked to prevent unintended movement.</p>
        </template>

        <template v-else>
          <div class="map-control-group">
            <button type="button" class="map-control-btn" @click="handleRecenter">
              Recenter
            </button>
            <button
              type="button"
              class="map-control-btn map-control-btn--primary"
              @click="handleFinishEditing"
            >
              Finish
            </button>
            <button
              type="button"
              :class="['map-control-btn', { 'is-active': isRotationEnabled }]"
              @click="isRotationEnabled = !isRotationEnabled"
            >
              {{ isRotationEnabled ? 'Disable Rotation' : 'Enable Rotation' }}
            </button>
          </div>
          <p class="map-control-hint">
            Drag to move and scroll or pinch to zoom. Use keyboard arrows to pan and +/- to zoom.
          </p>
          <div class="map-control-group map-control-slider-row">
            <button type="button" class="map-control-btn" @click="handleZoomOut">
              -
            </button>
            <input
              class="map-control-slider"
              type="range"
              :min="mapMinZoom"
              :max="mapMaxZoom"
              :step="0.1"
              :value="mapZoom"
              aria-label="Zoom level"
              @input="handleZoomSlider"
            />
            <button type="button" class="map-control-btn" @click="handleZoomIn">
              +
            </button>
          </div>

          <div v-if="isRotationEnabled" class="map-control-group map-control-slider-row">
            <button
              type="button"
              class="map-control-btn"
              @click="handleRotateBy(-15)"
            >
              Left
            </button>
            <input
              class="map-control-slider"
              type="range"
              min="-180"
              max="180"
              step="15"
              :value="Math.round(mapBearing / 15) * 15"
              aria-label="Rotation angle"
              @input="handleRotationSlider"
            />
            <button
              type="button"
              class="map-control-btn"
              @click="handleRotateBy(15)"
            >
              Right
            </button>
          </div>
        </template>
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
import { useMapStore, DEFAULT_LAT, DEFAULT_LOCATION_LABEL, DEFAULT_LON } from "~/stores/map";
import { useMapSync } from "~/composables/useMapSync";
import { MAP_BUTTON_ZOOM_DURATION_MS, MAP_BUTTON_ZOOM_STEP, MAP_OVERZOOM_SCALE } from "~/lib/map/constants";
import { ensureGoogleFont } from "~/lib/utils/fonts";

const COUNTRY_VIEW_ZOOM_LEVEL = 10;
const CONTINENT_VIEW_ZOOM_LEVEL = 6;

const emit = defineEmits<{
  "map-ready": [map: MapLibreMap];
}>();

const store = useMapStore();

const mapRef = ref<MapLibreMap | null>(null);
const frameRef = ref<HTMLDivElement | null>(null);
const isEditing = ref(false);
const isRotationEnabled = ref(false);
const mapBearing = ref(0);
const savedCenter = ref<{ lat: number; lon: number } | null>(null);

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

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!frameRef.value || !import.meta.client) {
    return;
  }

  resizeObserver = new ResizeObserver((entries) => {
    if (!entries.length) return;
    setContainerWidth(entries[0].contentRect.width);
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

  map.on("rotate", () => {
    mapBearing.value = map.getBearing();
  });
};

const onMove = async (center: [number, number], _zoom: number) => {
  await handleMove(center);
};

const onMoveEnd = async (center: [number, number], zoom: number) => {
  await handleMoveEnd(center, zoom);
};

const handleStartEditing = () => {
  savedCenter.value = { lat: store.latitude, lon: store.longitude };
  isEditing.value = true;
  if (mapRef.value) {
    mapBearing.value = mapRef.value.getBearing();
  }
};

const handleFinishEditing = () => {
  isEditing.value = false;
  isRotationEnabled.value = false;
};

const handleZoomIn = () => {
  if (!mapRef.value) return;
  const nextZoom = Math.min(mapRef.value.getZoom() + MAP_BUTTON_ZOOM_STEP, mapMaxZoom.value);
  if (Math.abs(nextZoom - mapRef.value.getZoom()) < 0.0001) return;
  mapRef.value.zoomTo(nextZoom, { duration: MAP_BUTTON_ZOOM_DURATION_MS });
};

const handleZoomOut = () => {
  if (!mapRef.value) return;
  const nextZoom = Math.max(mapRef.value.getZoom() - MAP_BUTTON_ZOOM_STEP, mapMinZoom.value);
  if (Math.abs(nextZoom - mapRef.value.getZoom()) < 0.0001) return;
  mapRef.value.zoomTo(nextZoom, { duration: MAP_BUTTON_ZOOM_DURATION_MS });
};

const handleZoomSlider = (event: Event) => {
  if (!mapRef.value) return;
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  mapRef.value.zoomTo(value, { duration: MAP_BUTTON_ZOOM_DURATION_MS });
};

const handleRotateBy = (deltaDeg: number) => {
  if (!mapRef.value) return;
  const current = mapRef.value.getBearing();
  const nextBearing = Math.max(-180, Math.min(180, current + deltaDeg));
  mapBearing.value = nextBearing;
  mapRef.value.rotateTo(nextBearing, { duration: MAP_BUTTON_ZOOM_DURATION_MS });
};

const handleRotationSlider = (event: Event) => {
  if (!mapRef.value) return;
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  mapBearing.value = value;
  mapRef.value.rotateTo(value, { duration: MAP_BUTTON_ZOOM_DURATION_MS });
};

const handleRecenter = () => {
  if (!mapRef.value) return;

  const center = savedCenter.value || {
    lat: store.latitude || DEFAULT_LAT,
    lon: store.longitude || DEFAULT_LON,
  };

  store.setCoordinates(center.lat, center.lon);

  mapRef.value.stop();
  mapRef.value.jumpTo({
    center: [center.lon, center.lat],
    zoom: mapZoom.value,
    bearing: 0,
    pitch: 0,
  });

  mapBearing.value = 0;

  if (!store.location.trim()) {
    store.location = DEFAULT_LOCATION_LABEL;
  }
};

const getMap = () => mapRef.value;
const flyTo = (lat: number, lon: number) => {
  flyToLocation(lat, lon);
};

defineExpose({
  getMap,
  flyTo,
});
</script>

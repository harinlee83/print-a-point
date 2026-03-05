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
          ref="shapeContainerRef"
          class="map-shape-container"
          :class="{ 'map-shape-container--draggable': store.editMode === 'shape' && !isNoneShape }"
          :style="{
            clipPath: computedClipPath,
            transform: `translate(${store.mapShapeOffsetX}%, ${store.mapShapeOffsetY}%)`,
          }"
        >
          <ClientOnly>
            <MapCanvas
              :style="store.mapStyle"
              :center="mapCenter"
              :zoom="mapZoom"
              :interactive="store.editMode === 'map'"
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
        <div
          v-if="store.editMode === 'shape' && !isNoneShape"
          ref="dragOverlayRef"
          class="map-shape-drag-overlay"
          aria-label="Drag to reposition shape"
          @pointerdown="onShapeDragStart"
        />
        <PosterPin
          :show="store.showPin"
          :style-id="store.pinStyleId"
          :color="store.effectivePinColor"
          :size="store.pinSize"
          :offset-x="store.pinOffsetX"
          :offset-y="store.pinOffsetY"
        />
        <div
          class="poster-text-wrapper"
          :class="{ 'poster-text-wrapper--draggable': store.editMode === 'text' }"
          :style="{
            transform: `translate(${store.textOffsetX}%, ${store.textOffsetY}%)`,
          }"
        >
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
            :text-spacing="store.textSpacing"
          />
        </div>
        <div
          v-if="store.editMode === 'text' && store.showAnyText"
          class="map-shape-drag-overlay"
          aria-label="Drag to reposition text"
          @pointerdown="onTextDragStart"
        />
        <div
          v-if="store.editMode === 'pin' && store.showPin"
          class="map-shape-drag-overlay"
          aria-label="Drag to reposition pin"
          @pointerdown="onPinDragStart"
        />
        <div v-show="showGuideX" class="snap-guide snap-guide--vertical" />
        <div v-show="showGuideY" class="snap-guide snap-guide--horizontal" />
        <p class="poster-watermark" :style="{ color: store.effectiveTheme.ui.text }">
          Made with printapoint.com
        </p>
      </div>
    </div>
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
import { resolveMapShape, getScaledCssClipPath } from "~/lib/shapes/mapShapes";
import { snapToCenter } from "~/lib/utils/snap";

const COUNTRY_VIEW_ZOOM_LEVEL = 10;
const CONTINENT_VIEW_ZOOM_LEVEL = 6;

const emit = defineEmits<{
  "map-ready": [map: MapLibreMap];
}>();

const store = useMapStore();

const mapRef = ref<MapLibreMap | null>(null);
const frameRef = ref<HTMLDivElement | null>(null);
const shapeContainerRef = ref<HTMLDivElement | null>(null);
const dragOverlayRef = ref<HTMLDivElement | null>(null);
const showGuideX = ref(false);
const showGuideY = ref(false);

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

const effectiveShapeScale = computed(() => store.mapShapeScale ?? 1);

const computedClipPath = computed(() => {
  if (store.mapShape === "none") return undefined;
  if (frameWidth.value > 0 && frameHeight.value > 0) {
    return getScaledCssClipPath(
      store.mapShape,
      frameWidth.value,
      frameHeight.value,
      effectiveShapeScale.value,
    );
  }
  return activeShape.value.cssClipPath;
});

function onShapeDragStart(e: PointerEvent) {
  e.preventDefault();
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

  const frame = frameRef.value;
  if (!frame) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const startOffsetX = store.mapShapeOffsetX;
  const startOffsetY = store.mapShapeOffsetY;

  const onMove = (moveE: PointerEvent) => {
    const rect = frame.getBoundingClientRect();
    const deltaX = ((moveE.clientX - startX) / rect.width) * 100;
    const deltaY = ((moveE.clientY - startY) / rect.height) * 100;
    const snapX = snapToCenter(startOffsetX + deltaX);
    const snapY = snapToCenter(startOffsetY + deltaY);
    showGuideX.value = snapX.snapped;
    showGuideY.value = snapY.snapped;
    store.setMapShapeOffset(snapX.value, snapY.value);
  };

  const onUp = () => {
    showGuideX.value = false;
    showGuideY.value = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
}

function onTextDragStart(e: PointerEvent) {
  e.preventDefault();
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

  const frame = frameRef.value;
  if (!frame) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const startOffsetX = store.textOffsetX;
  const startOffsetY = store.textOffsetY;

  const onMove = (moveE: PointerEvent) => {
    const rect = frame.getBoundingClientRect();
    const deltaX = ((moveE.clientX - startX) / rect.width) * 100;
    const deltaY = ((moveE.clientY - startY) / rect.height) * 100;
    const snapX = snapToCenter(startOffsetX + deltaX);
    const snapY = snapToCenter(startOffsetY + deltaY);
    showGuideX.value = snapX.snapped;
    showGuideY.value = snapY.snapped;
    store.setTextOffset(snapX.value, snapY.value);
  };

  const onUp = () => {
    showGuideX.value = false;
    showGuideY.value = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
}

function onPinDragStart(e: PointerEvent) {
  e.preventDefault();
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

  const frame = frameRef.value;
  if (!frame) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const startOffsetX = store.pinOffsetX;
  const startOffsetY = store.pinOffsetY;

  const onMove = (moveE: PointerEvent) => {
    const rect = frame.getBoundingClientRect();
    const deltaX = ((moveE.clientX - startX) / rect.width) * 100;
    const deltaY = ((moveE.clientY - startY) / rect.height) * 100;
    const snapX = snapToCenter(startOffsetX + deltaX);
    const snapY = snapToCenter(startOffsetY + deltaY);
    showGuideX.value = snapX.snapped;
    showGuideY.value = snapY.snapped;
    store.setPinOffset(snapX.value, snapY.value);
  };

  const onUp = () => {
    showGuideX.value = false;
    showGuideY.value = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
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
  () => store.showPin,
  (showPin, prevShowPin) => {
    if (showPin && !prevShowPin) {
      store.setPinOffset(0, 0);
    }
    if (!showPin && store.editMode === "pin") {
      store.setEditMode("none");
    }
  },
);

watch(
  () => store.showAnyText,
  (showAnyText) => {
    if (!showAnyText && store.editMode === "text") {
      store.setEditMode("none");
    }
  },
);

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

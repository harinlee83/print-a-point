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
          :class="{ 'map-shape-container--draggable': isPositioningShape && !isNoneShape }"
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
              :interactive="isEditingMap"
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
          v-if="isPositioningShape && !isNoneShape"
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
          :class="{ 'poster-text-wrapper--draggable': isPositioningText }"
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
          v-if="isPositioningText && store.showAnyText"
          class="map-shape-drag-overlay"
          aria-label="Drag to reposition text"
          @pointerdown="onTextDragStart"
        />
        <div
          v-if="isPositioningPin && store.showPin"
          class="map-shape-drag-overlay"
          aria-label="Drag to reposition pin"
          @pointerdown="onPinDragStart"
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
            :class="['map-control-btn', { 'map-control-btn--primary': isEditingMap }]"
            @click="toggleEditMap"
          >
            {{ isEditingMap ? 'Done' : 'Edit Map' }}
          </button>
          <button
            v-if="!isNoneShape"
            type="button"
            :class="['map-control-btn', { 'map-control-btn--primary': isPositioningShape }]"
            @click="togglePositionShape"
          >
            {{ isPositioningShape ? 'Done' : 'Edit Map Shape Position' }}
          </button>
          <button
            v-if="store.showAnyText"
            type="button"
            :class="['map-control-btn', { 'map-control-btn--primary': isPositioningText }]"
            @click="togglePositionText"
          >
            {{ isPositioningText ? 'Done' : 'Edit Text Position' }}
          </button>
          <button
            v-if="store.showPin"
            type="button"
            :class="['map-control-btn', { 'map-control-btn--primary': isPositioningPin }]"
            @click="togglePositionPin"
          >
            {{ isPositioningPin ? 'Done' : 'Edit Pin Position' }}
          </button>
        </div>
        <p class="map-control-hint">
          {{ hintText }}
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
import { resolveMapShape, getScaledCssClipPath } from "~/lib/shapes/mapShapes";

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
const isEditingMap = ref(false);
const isPositioningShape = ref(false);
const isPositioningText = ref(false);
const isPositioningPin = ref(false);

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

const hintText = computed(() => {
  if (isEditingMap.value) {
    return "Drag to move the map, scroll or pinch to zoom.";
  }
  if (isPositioningShape.value) {
    return "Drag the shape to reposition it. The map stays fixed.";
  }
  if (isPositioningText.value) {
    return "Drag to reposition the text block.";
  }
  if (isPositioningPin.value) {
    return "Drag to reposition the pin.";
  }
  return "Map is locked. Use Edit Map to pan/zoom, Edit Map Shape Position to move the mask, Edit Text Position to move the text, or Edit Pin Position to move the pin.";
});

function toggleEditMap() {
  if (isEditingMap.value) {
    isEditingMap.value = false;
  } else {
    isPositioningShape.value = false;
    isPositioningText.value = false;
    isPositioningPin.value = false;
    isEditingMap.value = true;
  }
}

function togglePositionShape() {
  if (isPositioningShape.value) {
    isPositioningShape.value = false;
  } else {
    isEditingMap.value = false;
    isPositioningText.value = false;
    isPositioningPin.value = false;
    isPositioningShape.value = true;
  }
}

function togglePositionText() {
  if (isPositioningText.value) {
    isPositioningText.value = false;
  } else {
    isEditingMap.value = false;
    isPositioningShape.value = false;
    isPositioningPin.value = false;
    isPositioningText.value = true;
  }
}

function togglePositionPin() {
  if (isPositioningPin.value) {
    isPositioningPin.value = false;
  } else {
    isEditingMap.value = false;
    isPositioningShape.value = false;
    isPositioningText.value = false;
    isPositioningPin.value = true;
  }
}

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
    store.setMapShapeOffset(startOffsetX + deltaX, startOffsetY + deltaY);
  };

  const onUp = () => {
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
    store.setTextOffset(startOffsetX + deltaX, startOffsetY + deltaY);
  };

  const onUp = () => {
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
    store.setPinOffset(startOffsetX + deltaX, startOffsetY + deltaY);
  };

  const onUp = () => {
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

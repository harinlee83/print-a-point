<template>
  <div class="map-container" :style="{ ...containerStyle, overflow: 'hidden' }">
    <div ref="containerRef" :style="innerStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { StyleSpecification, Map as MapLibreMap } from "maplibre-gl";
import {
  MAP_CENTER_SYNC_EPSILON,
  MAP_ZOOM_SYNC_EPSILON,
} from "~/lib/map/constants";

const props = withDefaults(
  defineProps<{
    style: StyleSpecification;
    center: [number, number];
    zoom: number;
    interactive?: boolean;
    allowRotation?: boolean;
    minZoom?: number;
    maxZoom?: number;
    containerStyle?: Record<string, string>;
    overzoomScale?: number;
  }>(),
  {
    interactive: false,
    allowRotation: false,
    overzoomScale: 1,
  },
);

const emit = defineEmits<{
  move: [center: [number, number], zoom: number];
  moveend: [center: [number, number], zoom: number];
  ready: [map: MapLibreMap];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const map = ref<MapLibreMap | null>(null);
const isSyncing = ref(false);
let hasMountedStyle = false;

const normalizedOverzoomScale = computed(() => Math.max(1, props.overzoomScale));
const innerStyle = computed<Record<string, string>>(() =>
  normalizedOverzoomScale.value === 1
    ? { width: "100%", height: "100%" }
    : {
        width: `${normalizedOverzoomScale.value * 100}%`,
        height: `${normalizedOverzoomScale.value * 100}%`,
        transform: `scale(${1 / normalizedOverzoomScale.value})`,
        transformOrigin: "top left",
      },
);

onMounted(async () => {
  if (!containerRef.value || !import.meta.client) return;

  const maplibregl = await import("maplibre-gl");

  const instance = new maplibregl.Map({
    container: containerRef.value,
    style: props.style,
    center: props.center,
    zoom: props.zoom,
    interactive: props.interactive,
    attributionControl: false,
    canvasContextAttributes: { preserveDrawingBuffer: true },
  });

  map.value = instance;
  emit("ready", instance);

  instance.on("move", () => {
    if (isSyncing.value) return;
    const currentCenter = instance.getCenter();
    emit("move", [currentCenter.lng, currentCenter.lat], instance.getZoom());
  });

  instance.on("moveend", () => {
    if (isSyncing.value) return;
    const currentCenter = instance.getCenter();
    emit("moveend", [currentCenter.lng, currentCenter.lat], instance.getZoom());
  });
});

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

watch(
  () => props.interactive,
  (interactive) => {
    const instance = map.value;
    if (!instance) return;

    if (interactive) {
      instance.scrollZoom.enable();
      instance.dragPan.enable();
      instance.touchZoomRotate.enable();
      instance.doubleClickZoom.enable();
      instance.keyboard.enable();
      if (props.allowRotation) {
        instance.dragRotate.enable();
        instance.touchZoomRotate.enableRotation();
      } else {
        instance.dragRotate.disable();
        instance.touchZoomRotate.disableRotation();
      }
    } else {
      instance.scrollZoom.disable();
      instance.dragPan.disable();
      instance.touchZoomRotate.disable();
      instance.doubleClickZoom.disable();
      instance.keyboard.disable();
      instance.touchZoomRotate.disableRotation();
      instance.dragRotate.disable();
    }
  },
  { immediate: true },
);

watch(
  () => props.allowRotation,
  (allowRotation) => {
    const instance = map.value;
    if (!instance || !props.interactive) return;

    if (allowRotation) {
      instance.dragRotate.enable();
      instance.touchZoomRotate.enableRotation();
    } else {
      instance.dragRotate.disable();
      instance.touchZoomRotate.disableRotation();
    }
  },
);

watch(
  () => [props.minZoom, props.maxZoom],
  ([minZoom, maxZoom]) => {
    const instance = map.value;
    if (!instance) return;

    if (typeof minZoom === "number") {
      instance.setMinZoom(minZoom);
    }
    if (typeof maxZoom === "number") {
      instance.setMaxZoom(maxZoom);
    }
  },
  { immediate: true },
);

watch(
  () => props.style,
  (nextStyle) => {
    const instance = map.value;
    if (!instance) return;

    if (!hasMountedStyle) {
      hasMountedStyle = true;
      return;
    }

    if (instance.isStyleLoaded()) {
      instance.setStyle(nextStyle);
      return;
    }

    const applyStyleWhenReady = () => {
      instance.setStyle(nextStyle);
    };

    instance.once("load", applyStyleWhenReady);
  },
  { deep: true },
);

watch(
  () => [props.center[0], props.center[1], props.zoom],
  () => {
    const instance = map.value;
    if (!instance) return;

    const currentCenter = instance.getCenter();
    const centerDelta = Math.max(
      Math.abs(currentCenter.lng - props.center[0]),
      Math.abs(currentCenter.lat - props.center[1]),
    );
    const zoomDelta = Math.abs(instance.getZoom() - props.zoom);

    if (
      centerDelta < MAP_CENTER_SYNC_EPSILON &&
      zoomDelta < MAP_ZOOM_SYNC_EPSILON
    ) {
      return;
    }

    isSyncing.value = true;
    instance.jumpTo({ center: props.center, zoom: props.zoom });
    requestAnimationFrame(() => {
      isSyncing.value = false;
    });
  },
);

defineExpose({
  map,
});
</script>

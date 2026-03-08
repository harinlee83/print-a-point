<template>
  <section class="panel-block">
    <h2>Aspect Ratio</h2>
    <div class="ratio-grid">
      <button
        v-for="r in validRatios"
        :key="r.id"
        type="button"
        :class="['ratio-card', { 'is-active': r.id === modelValue }]"
        @click="$emit('update:modelValue', r.id)"
      >
        <div class="ratio-shape-wrap">
          <div
            class="ratio-shape"
            :style="shapeStyle(r)"
          />
        </div>
        <span class="ratio-label">{{ r.label }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AspectRatio } from "~~/shared/aspectRatios";
import type { ProductTypeId, FrameColorId } from "~~/shared/productCatalog";
import { hasAnyExactSizeMatch } from "~~/shared/productCatalog";

const props = defineProps<{
  ratios: AspectRatio[];
  modelValue: string;
  productType: ProductTypeId;
  frameColor?: FrameColorId;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();

const validRatios = computed(() => {
  return props.ratios.filter((r) => 
    hasAnyExactSizeMatch(props.productType, r.w / r.h, props.frameColor)
  );
});

function shapeStyle(r: AspectRatio) {
  const maxH = 36; // px - max height of shape preview
  const maxW = 28; // px - max width of shape preview
  const ratio = r.w / r.h;

  let w: number;
  let h: number;

  if (ratio >= 1) {
    // landscape or square
    w = maxW;
    h = maxW / ratio;
    if (h > maxH) {
      h = maxH;
      w = maxH * ratio;
    }
  } else {
    // portrait
    h = maxH;
    w = maxH * ratio;
    if (w > maxW) {
      w = maxW;
      h = maxW / ratio;
    }
  }

  return {
    width: `${Math.round(w)}px`,
    height: `${Math.round(h)}px`,
  };
}
</script>

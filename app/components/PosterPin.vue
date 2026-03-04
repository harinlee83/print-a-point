<template>
  <svg
    v-if="show && pinStyle"
    class="poster-pin"
    :viewBox="pinStyle.viewBox.join(' ')"
    :style="{
      width: widthCqmin,
      height: heightCqmin,
      left: '50%',
      top: '50%',
      transform: `translate(${anchorTranslateX}, ${anchorTranslateY})`,
      color: color,
    }"
  >
    <path :d="pinStyle.path" fill="currentColor" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  getPinStyleById,
  DEFAULT_PIN_STYLE_ID,
  pinSizeToRefPx,
} from "~/lib/pin/pinStyles";
import { TEXT_DIMENSION_REFERENCE_PX } from "~/lib/export/textLayout";

const props = defineProps<{
  show: boolean;
  styleId: string;
  color: string;
  size: number;
}>();

const toCqMin = (px: number) => (px / TEXT_DIMENSION_REFERENCE_PX) * 100;

const pinStyle = computed(
  () => getPinStyleById(props.styleId) || getPinStyleById(DEFAULT_PIN_STYLE_ID),
);

const heightCqmin = computed(() => {
  const refPx = pinSizeToRefPx(props.size);
  return `${toCqMin(refPx)}cqmin`;
});

const widthCqmin = computed(() => {
  const s = pinStyle.value;
  if (!s) return "0";
  const refPx = pinSizeToRefPx(props.size);
  const aspect = s.viewBox[2] / s.viewBox[3];
  return `${toCqMin(refPx * aspect)}cqmin`;
});

const anchorTranslateX = computed(() => {
  const s = pinStyle.value;
  if (!s) return "-50%";
  return `${-(s.anchor[0] / s.viewBox[2]) * 100}%`;
});

const anchorTranslateY = computed(() => {
  const s = pinStyle.value;
  if (!s) return "-50%";
  return `${-(s.anchor[1] / s.viewBox[3]) * 100}%`;
});
</script>

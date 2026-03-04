<template>
  <div class="poster-text-overlay" :style="{ color: textColor }">
    <p
      v-if="showTitle"
      class="poster-city"
      :style="{
        fontFamily: titleFont,
        top: `${cityYPercent}%`,
        fontSize: cityFontSize,
        fontWeight: preset.cityWeight,
        letterSpacing: preset.cityLetterSpacing || undefined,
        textTransform: (preset.cityTransform as any) || undefined,
      }"
    >
      {{ cityLabel }}
    </p>
    <hr
      v-if="showDivider"
      class="poster-divider"
      :style="{
        borderColor: textColor,
        top: `${dividerYPercent}%`,
      }"
    />
    <p
      v-if="showSubtitle"
      class="poster-country"
      :style="{
        fontFamily: titleFont,
        top: `${countryYPercent}%`,
        fontSize: countryFontSize,
        fontWeight: preset.countryWeight,
        letterSpacing: preset.countryLetterSpacing || undefined,
        textTransform: (preset.countryTransform as any) || undefined,
      }"
    >
      {{ countryLabel }}
    </p>
    <p
      v-if="showCoordinates"
      class="poster-coords"
      :style="{
        fontFamily: bodyFont,
        top: `${coordsYPercent}%`,
        fontSize: coordsFontSize,
        fontWeight: preset.coordsWeight,
      }"
    >
      {{ coordsText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatCoordinates } from "~/lib/location/coordinates";
import {
  TEXT_DIMENSION_REFERENCE_PX,
  TEXT_CITY_Y_RATIO,
  TEXT_DIVIDER_Y_RATIO,
  TEXT_COUNTRY_Y_RATIO,
  TEXT_COORDS_Y_RATIO,
  TEXT_AREA_START_FIXED,
  CITY_TEXT_SHRINK_THRESHOLD,
  CITY_TEXT_SHRINK_THRESHOLD_LATIN,
  CITY_FONT_BASE_PX,
  CITY_FONT_MIN_PX,
  COUNTRY_FONT_BASE_PX,
  COORDS_FONT_BASE_PX,
  formatCityLabel,
  isLatinScript,
} from "~/lib/export/textLayout";
import { resolveTextPreset } from "~/lib/text/textPresets";

const props = defineProps<{
  city: string;
  country: string;
  lat: number;
  lon: number;
  fontFamily: string;
  textColor: string;
  showTitle: boolean;
  showDivider: boolean;
  showSubtitle: boolean;
  showCoordinates: boolean;
  textPresetId: string;
  mapShapeId: string;
  coordinates: string;
}>();

const preset = computed(() => resolveTextPreset(props.textPresetId));

const isNoneShape = computed(() => props.mapShapeId === "none");

const toCqMin = (px: number) => (px / TEXT_DIMENSION_REFERENCE_PX) * 100;

const titleFont = computed(() =>
  props.fontFamily
    ? `"${props.fontFamily}", "Space Grotesk", sans-serif`
    : '"Space Grotesk", sans-serif',
);
const bodyFont = computed(() =>
  props.fontFamily
    ? `"${props.fontFamily}", "IBM Plex Mono", monospace`
    : '"IBM Plex Mono", monospace',
);

const cityLabel = computed(() => {
  if (preset.value.useWideSpacing) {
    return formatCityLabel(props.city);
  }
  if (preset.value.cityTransform === "uppercase") {
    return props.city.toUpperCase();
  }
  return props.city;
});

const countryLabel = computed(() => {
  if (preset.value.countryTransform === "uppercase") {
    return props.country.toUpperCase();
  }
  return props.country;
});

const coordsText = computed(() =>
  props.coordinates.trim()
    ? props.coordinates.trim()
    : formatCoordinates(props.lat, props.lon),
);

// For non-none shapes, text goes below the shape. Use fixed start so text spacing stays consistent regardless of shape or shape size.
const textAreaStart = computed(() => {
  if (isNoneShape.value) return 0;
  return TEXT_AREA_START_FIXED;
});

function computeYPercent(baseRatio: number): number {
  if (isNoneShape.value) return baseRatio * 100;
  // Map the text area (shapeBottomRatio..1) to the original ratios
  const start = textAreaStart.value;
  const available = 1 - start;
  // Remap: original text occupies ~0.845..0.93, normalize to 0..1 then fill available
  const textRangeStart = TEXT_CITY_Y_RATIO;
  const textRangeEnd = TEXT_COORDS_Y_RATIO;
  const normalT = (baseRatio - textRangeStart) / (textRangeEnd - textRangeStart);
  // Add padding (10% of available at top, 15% at bottom)
  const padTop = available * 0.15;
  const usable = available * 0.7;
  return (start + padTop + normalT * usable) * 100;
}

const cityYPercent = computed(() => computeYPercent(TEXT_CITY_Y_RATIO));
const dividerYPercent = computed(() => computeYPercent(TEXT_DIVIDER_Y_RATIO));
const countryYPercent = computed(() => computeYPercent(TEXT_COUNTRY_Y_RATIO));
const coordsYPercent = computed(() => computeYPercent(TEXT_COORDS_Y_RATIO));

const cityFontSize = computed(() => {
  const label = cityLabel.value;
  const cityLen = Math.max(label.length, 1);
  const threshold = isLatinScript(props.city)
    ? CITY_TEXT_SHRINK_THRESHOLD_LATIN
    : CITY_TEXT_SHRINK_THRESHOLD;
  const cityBaseSize = toCqMin(CITY_FONT_BASE_PX * preset.value.citySizeScale);
  const cityMinSize = toCqMin(CITY_FONT_MIN_PX);
  if (cityLen > threshold) {
    return `${Math.max(
      cityMinSize,
      cityBaseSize * (threshold / cityLen),
    )}cqmin`;
  }
  return `${cityBaseSize}cqmin`;
});

const countryFontSize = computed(
  () => `${toCqMin(COUNTRY_FONT_BASE_PX * preset.value.countrySizeScale)}cqmin`,
);
const coordsFontSize = computed(
  () => `${toCqMin(COORDS_FONT_BASE_PX * preset.value.coordsSizeScale)}cqmin`,
);
</script>

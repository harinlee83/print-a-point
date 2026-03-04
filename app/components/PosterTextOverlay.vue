<template>
  <div class="poster-text-overlay" :style="{ color: textColor }">
    <template v-if="showPosterText">
      <p
        class="poster-city"
        :style="{
          fontFamily: titleFont,
          top: `${TEXT_CITY_Y_RATIO * 100}%`,
          fontSize: cityFontSize,
        }"
      >
        {{ cityLabel }}
      </p>
      <hr
        class="poster-divider"
        :style="{
          borderColor: textColor,
          top: `${TEXT_DIVIDER_Y_RATIO * 100}%`,
        }"
      />
      <p
        class="poster-country"
        :style="{
          fontFamily: titleFont,
          top: `${TEXT_COUNTRY_Y_RATIO * 100}%`,
          fontSize: countryFontSize,
        }"
      >
        {{ country.toUpperCase() }}
      </p>
      <p
        class="poster-coords"
        :style="{
          fontFamily: bodyFont,
          top: `${TEXT_COORDS_Y_RATIO * 100}%`,
          fontSize: coordsFontSize,
        }"
      >
        {{ formatCoordinates(lat, lon) }}
      </p>
    </template>
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
  CITY_TEXT_SHRINK_THRESHOLD,
  CITY_TEXT_SHRINK_THRESHOLD_LATIN,
  CITY_FONT_BASE_PX,
  CITY_FONT_MIN_PX,
  COUNTRY_FONT_BASE_PX,
  COORDS_FONT_BASE_PX,
  formatCityLabel,
  isLatinScript,
} from "~/lib/export/textLayout";

const props = defineProps<{
  city: string;
  country: string;
  lat: number;
  lon: number;
  fontFamily: string;
  textColor: string;
  showPosterText: boolean;
}>();

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

const cityLabel = computed(() => formatCityLabel(props.city));

const cityFontSize = computed(() => {
  const cityLen = Math.max(cityLabel.value.length, 1);
  const threshold = isLatinScript(props.city)
    ? CITY_TEXT_SHRINK_THRESHOLD_LATIN
    : CITY_TEXT_SHRINK_THRESHOLD;
  const cityBaseSize = toCqMin(CITY_FONT_BASE_PX);
  const cityMinSize = toCqMin(CITY_FONT_MIN_PX);
  if (cityLen > threshold) {
    return `${Math.max(
      cityMinSize,
      cityBaseSize * (threshold / cityLen),
    )}cqmin`;
  }
  return `${cityBaseSize}cqmin`;
});

const countryFontSize = computed(() => `${toCqMin(COUNTRY_FONT_BASE_PX)}cqmin`);
const coordsFontSize = computed(() => `${toCqMin(COORDS_FONT_BASE_PX)}cqmin`);
</script>

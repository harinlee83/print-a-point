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
        ...(dividerWidthStyle),
      }"
    />
    <p
      v-if="showSubtitle"
      class="poster-country"
      :style="{
        fontFamily: subtitleFont,
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
        fontFamily: coordsFont,
        top: `${coordsYPercent}%`,
        fontSize: coordsFontSize,
        fontWeight: preset.coordsWeight,
        letterSpacing: preset.coordsLetterSpacing || undefined,
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
  CITY_TEXT_SHRINK_THRESHOLD,
  CITY_TEXT_SHRINK_THRESHOLD_LATIN,
  CITY_FONT_BASE_PX,
  CITY_FONT_MIN_PX,
  COUNTRY_FONT_BASE_PX,
  COORDS_FONT_BASE_PX,
  formatCityLabel,
  isLatinScript,
} from "~/lib/export/textLayout";
import type { TextPreset } from "~/lib/text/textPresets";

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
  preset: TextPreset;
  mapShapeId: string;
  coordinates: string;
  textSpacing?: number;
  titleFontFamily?: string;
  subtitleFontFamily?: string;
  coordsFontFamily?: string;
  dividerLength?: number | null;
}>();

const toCqMin = (px: number) => (px / TEXT_DIMENSION_REFERENCE_PX) * 100;

const titleFont = computed(() => {
  const family = props.titleFontFamily || props.fontFamily;
  return family
    ? `"${family}", "Space Grotesk", sans-serif`
    : '"Space Grotesk", sans-serif';
});
const subtitleFont = computed(() => {
  const family = props.subtitleFontFamily || props.fontFamily;
  return family
    ? `"${family}", "Space Grotesk", sans-serif`
    : '"Space Grotesk", sans-serif';
});
const coordsFont = computed(() => {
  const family = props.coordsFontFamily || props.fontFamily;
  return family
    ? `"${family}", "IBM Plex Mono", monospace`
    : '"IBM Plex Mono", monospace';
});

const dividerWidthStyle = computed(() => {
  if (props.dividerLength == null) return {};
  const pct = props.dividerLength * 100;
  return { width: `${pct}%`, left: `${(100 - pct) / 2}%` };
});

const cityLabel = computed(() => {
  if (props.preset.useWideSpacing) {
    return formatCityLabel(props.city);
  }
  if (props.preset.cityTransform === "uppercase") {
    return props.city.toUpperCase();
  }
  return props.city;
});

const countryLabel = computed(() => {
  if (props.preset.countryTransform === "uppercase") {
    return props.country.toUpperCase();
  }
  return props.country;
});

const coordsText = computed(() =>
  props.coordinates.trim()
    ? props.coordinates.trim()
    : formatCoordinates(props.lat, props.lon),
);

// Fixed positions for all shapes - text does not move when changing map shape.
// textSpacing (0.5-1.5) scales the gaps between lines. Default 1.
const spacing = computed(() => props.textSpacing ?? 1);

function computeYPercent(baseRatio: number): number {
  // Base: city 84.5%, divider 87.5%, country 90%, coords 93%
  // Gaps: 3%, 2.5%, 3%. Scale gaps by textSpacing.
  const cityBase = TEXT_CITY_Y_RATIO * 100;
  const gap1 = (TEXT_DIVIDER_Y_RATIO - TEXT_CITY_Y_RATIO) * 100 * spacing.value;
  const gap2 = (TEXT_COUNTRY_Y_RATIO - TEXT_DIVIDER_Y_RATIO) * 100 * spacing.value;
  const gap3 = (TEXT_COORDS_Y_RATIO - TEXT_COUNTRY_Y_RATIO) * 100 * spacing.value;

  if (baseRatio <= TEXT_CITY_Y_RATIO) return cityBase;
  if (baseRatio <= TEXT_DIVIDER_Y_RATIO) return cityBase + gap1;
  if (baseRatio <= TEXT_COUNTRY_Y_RATIO) return cityBase + gap1 + gap2;
  return cityBase + gap1 + gap2 + gap3;
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
  const cityBaseSize = toCqMin(CITY_FONT_BASE_PX * props.preset.citySizeScale);
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
  () => `${toCqMin(COUNTRY_FONT_BASE_PX * props.preset.countrySizeScale)}cqmin`,
);
const coordsFontSize = computed(
  () => `${toCqMin(COORDS_FONT_BASE_PX * props.preset.coordsSizeScale)}cqmin`,
);
</script>

<template>
  <form class="settings-panel" @submit.prevent>
    <div class="settings-scroll">
    <section class="panel-block">
      <h2>Location</h2>
      <label>
        Search place
        <div class="location-autocomplete">
          <div class="location-input-wrap">
            <input
              v-model="locationModel"
              class="form-control-tall"
              placeholder="Start typing a city or place"
              autocomplete="off"
              @focus="locationFocused = true"
              @blur="handleLocationBlur"
            />
            <button
              v-if="store.location.trim().length"
              type="button"
              class="location-clear-btn"
              aria-label="Clear location"
              @mousedown.prevent
              @click="clearLocation"
            >
              x
            </button>
          </div>
          <ul
            v-if="locationFocused && locationSuggestions.length"
            class="location-suggestions"
            role="listbox"
          >
            <li v-for="suggestion in locationSuggestions" :key="suggestion.id">
              <button
                type="button"
                class="location-suggestion"
                @mousedown.prevent="selectLocation(suggestion)"
              >
                {{ suggestion.label }}
              </button>
            </li>
            <li v-if="isLocationSearching" class="location-suggestion-status">
              Searching...
            </li>
          </ul>
        </div>
      </label>

      <div class="field-grid keep-two-mobile">
        <label>
          Latitude
          <input
            v-model.number="store.latitude"
            class="form-control-tall"
            type="number"
            step="0.000001"
            placeholder="52.374478"
          />
        </label>
        <label>
          Longitude
          <input
            v-model.number="store.longitude"
            class="form-control-tall"
            type="number"
            step="0.000001"
            placeholder="9.738553"
          />
        </label>
      </div>
    </section>

    <section class="panel-block">
      <h2>Map Settings</h2>
      <label>
        Theme
        <select
          v-model="themeModel"
          class="form-control-tall"
        >
          <option v-for="themeOption in themeOptions" :key="themeOption.id" :value="themeOption.id">
            {{ themeOption.name }}
          </option>
        </select>
      </label>

      <div class="distance-slider-block">
        <label>
          Distance (meters)
          <input
            :value="store.distance"
            class="distance-slider-input"
            type="number"
            min="1000"
            max="20000000"
            step="100"
            @input="onDistanceInput"
          />
        </label>
        <div class="slider-wrap" :style="{ '--fill-percent': distanceFillPercent + '%' }">
          <input
            class="distance-slider"
            type="range"
            min="0"
            max="1000"
            step="1"
            :value="distanceSliderValue"
            @input="onDistanceSlider"
          />
        </div>
      </div>

      <div class="map-details-card">
        <label class="toggle-field">
          <span>Show buildings</span>
          <input v-model="store.includeBuildings" type="checkbox" />
        </label>
        <label class="toggle-field">
          <span>Show water</span>
          <input v-model="store.includeWater" type="checkbox" />
        </label>
        <label class="toggle-field">
          <span>Show parks</span>
          <input v-model="store.includeParks" type="checkbox" />
        </label>
      </div>

      <label>Map shape</label>
      <div class="shape-style-grid">
        <button
          v-for="ms in MAP_SHAPES"
          :key="ms.id"
          type="button"
          :class="['shape-style-btn', { 'is-active': store.mapShape === ms.id }]"
          :title="ms.label"
          @click="store.setMapShape(ms.id)"
        >
          <svg class="shape-style-icon" viewBox="0 0 24 24">
            <path :d="ms.iconPath" fill="currentColor" />
          </svg>
        </button>
      </div>
      <label v-if="store.mapShape !== 'none'" class="color-input-row">
        <span>Background color</span>
        <input
          type="color"
          :value="store.shapeBackgroundColor || store.effectiveTheme.ui.bg"
          @input="onShapeBgColorInput"
        />
      </label>

      <div v-if="store.mapShape !== 'none'" class="distance-slider-block">
        <label>
          Map shape size
          <input
            :value="effectiveShapeScale"
            class="distance-slider-input"
            type="number"
            min="0.5"
            max="1.5"
            step="0.05"
            @input="onMapShapeScaleInput"
          />
        </label>
        <div class="slider-wrap" :style="{ '--fill-percent': shapeScaleFillPercent + '%' }">
          <input
            class="distance-slider"
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            :value="effectiveShapeScale"
            @input="onMapShapeScaleInput"
          />
        </div>
      </div>

      <div class="distance-slider-block">
        <label>
          Rotation
          <input
            :value="store.mapBearing"
            class="distance-slider-input"
            type="number"
            min="-180"
            max="180"
            step="1"
            @input="onRotationInput"
          />
        </label>
        <div class="slider-wrap" :style="{ '--fill-percent': rotationFillPercent + '%' }">
          <input
            class="distance-slider"
            type="range"
            min="-180"
            max="180"
            step="1"
            :value="store.mapBearing"
            @input="onRotationInput"
          />
        </div>
      </div>
    </section>

    <section class="panel-block">
      <div class="theme-color-header-row">
        <h2>Theme Colors</h2>
        <button type="button" class="ghost" @click="store.resetCustomColors()">
          Reset
        </button>
      </div>
      <div class="color-grid">
        <label v-for="key in DISPLAY_PALETTE_KEYS" :key="key" class="color-input-row">
          <span>{{ PALETTE_COLOR_LABELS[key] }}</span>
          <input
            type="color"
            :value="resolveColor(key)"
            @input="onColorInput(key, $event)"
          />
        </label>
      </div>
    </section>

    <section class="panel-block">
      <h2>Typography</h2>

      <label>Text style</label>
      <div class="text-preset-grid">
        <button
          v-for="tp in TEXT_PRESETS"
          :key="tp.id"
          type="button"
          :class="['text-preset-btn', { 'is-active': store.textPresetId === tp.id }]"
          @click="store.setTextPreset(tp.id)"
        >
          <span class="text-preset-preview" :style="{ fontFamily: tp.fontFamily ? `'${tp.fontFamily}', serif` : `'Space Grotesk', sans-serif` }">Aa</span>
          <span class="text-preset-label">{{ tp.label }}</span>
        </button>
      </div>

      <div class="distance-slider-block">
        <label>
          Text spacing
          <input
            :value="store.textSpacing"
            class="distance-slider-input"
            type="number"
            min="0.5"
            max="1.5"
            step="0.05"
            @input="onTextSpacingInput"
          />
        </label>
        <div class="slider-wrap" :style="{ '--fill-percent': textSpacingFillPercent + '%' }">
          <input
            class="distance-slider"
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            :value="store.textSpacing"
            @input="onTextSpacingInput"
          />
        </div>
      </div>

      <div class="map-details-card">
        <label class="toggle-field">
          <span>Title</span>
          <input v-model="store.showTitle" type="checkbox" />
        </label>
        <label class="toggle-field">
          <span>Divider</span>
          <input v-model="store.showDivider" type="checkbox" />
        </label>
        <label class="toggle-field">
          <span>Subtitle</span>
          <input v-model="store.showSubtitle" type="checkbox" />
        </label>
        <label class="toggle-field">
          <span>Coordinates</span>
          <input v-model="store.showCoordinates" type="checkbox" />
        </label>
      </div>

      <div class="field-grid keep-two-mobile">
        <label>
          Display city
          <input
            v-model="store.displayCity"
            class="form-control-tall"
            placeholder="Hanover"
          />
        </label>
        <label>
          Display country
          <input
            v-model="store.displayCountry"
            class="form-control-tall"
            placeholder="Germany"
          />
        </label>
      </div>
      <label v-if="store.showCoordinates">
        Display coordinates
        <input
          v-model="store.displayCoordinates"
          class="form-control-tall"
          :placeholder="autoCoordinates"
        />
      </label>
      <label>
        Font family
        <select v-model="store.fontFamily" class="form-control-tall">
          <option value="">Default (Space Grotesk)</option>
          <option v-for="fontOption in fontOptions" :key="fontOption" :value="fontOption">
            {{ fontOption }}
          </option>
        </select>
      </label>
    </section>

    <section class="panel-block">
      <h2>Map Pin</h2>
      <label class="toggle-field">
        <span>Show pin</span>
        <input v-model="store.showPin" type="checkbox" />
      </label>
      <template v-if="store.showPin">
        <div class="pin-style-grid">
          <button
            v-for="ps in PIN_STYLES"
            :key="ps.id"
            type="button"
            :class="['pin-style-btn', { 'is-active': store.pinStyleId === ps.id }]"
            :title="ps.label"
            @click="store.setPinStyle(ps.id)"
          >
            <svg
              class="pin-style-icon"
              :viewBox="ps.viewBox.join(' ')"
            >
              <path :d="ps.path" fill="currentColor" />
            </svg>
          </button>
        </div>
        <label class="color-input-row">
          <span>Pin color</span>
          <input
            type="color"
            :value="store.effectivePinColor"
            @input="onPinColorInput"
          />
        </label>
        <div class="distance-slider-block">
          <label>
            Pin size
            <input
              :value="store.pinSize"
              class="distance-slider-input"
              type="number"
              :min="PIN_SIZE_MIN"
              :max="PIN_SIZE_MAX"
              step="1"
              @input="onPinSizeInput"
            />
          </label>
          <div class="slider-wrap" :style="{ '--fill-percent': pinSizeFillPercent + '%' }">
            <input
              class="distance-slider"
              type="range"
              :min="PIN_SIZE_MIN"
              :max="PIN_SIZE_MAX"
              step="1"
              :value="store.pinSize"
              @input="onPinSizeInput"
            />
          </div>
        </div>
      </template>
    </section>

    </div>

    <div class="settings-fixed">
      <SizeSelector
        v-model="sizeModel"
        :sizes="POSTER_SIZES"
      />

      <div class="action-row">
        <button
          type="button"
          class="generate-btn"
          :disabled="store.isExporting || store.isCheckoutLoading"
          @click="$emit('buy')"
        >
          {{ buyButtonLabel }}
        </button>
        <p class="subtle-note">
          The "Made with printapoint.com" mark will be REMOVED from the final print.
        </p>
        <p class="subtle-note">
          Checkout and fulfillment are powered by Stripe and Printful.
        </p>
      </div>

      <div class="export-row">
        <button
          type="button"
          class="export-btn"
          :disabled="store.isExporting"
          @click="$emit('download-png')"
        >
          <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>PNG</span>
        </button>
        <button
          type="button"
          class="export-btn"
          :disabled="store.isExporting"
          @click="$emit('download-svg')"
        >
          <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>SVG</span>
        </button>
        <button
          type="button"
          class="export-btn"
          @click="$emit('share')"
        >
          <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Share</span>
        </button>
        <button
          type="button"
          class="export-btn"
          :disabled="store.isExporting"
          @click="$emit('show-preview')"
        >
          <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <span>Preview</span>
        </button>
      </div>

      <p v-if="shareCopied" class="success-note">Link copied to clipboard!</p>
      <p v-else-if="store.error" class="error">{{ store.error }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import SizeSelector from "~/components/SizeSelector.vue";
import { useLocationAutocomplete } from "~/composables/useLocationAutocomplete";
import { useMapStore } from "~/stores/map";
import { formatUsd, POSTER_SIZES, type PosterSizeId } from "~~/shared/posterSizes";
import {
  DISPLAY_PALETTE_KEYS,
  PALETTE_COLOR_LABELS,
} from "~/lib/theme/types";
import { getThemeColorByPath } from "~/lib/theme/colorPaths";
import { themeOptions } from "~/lib/theme/themeRepository";
import { PIN_STYLES, PIN_SIZE_MIN, PIN_SIZE_MAX } from "~/lib/pin/pinStyles";
import { MAP_SHAPES } from "~/lib/shapes/mapShapes";
import { TEXT_PRESETS } from "~/lib/text/textPresets";
import { formatCoordinates } from "~/lib/location/coordinates";
import type { SearchResult } from "~/lib/location/nominatim";

defineProps<{
  shareCopied?: boolean;
}>();

const emit = defineEmits<{
  buy: [];
  "location-selected": [lat: number, lon: number];
  "download-png": [];
  "download-svg": [];
  share: [];
  "show-preview": [];
}>();

const store = useMapStore();
const locationFocused = ref(false);

const locationModel = computed({
  get: () => store.location,
  set: (value: string) => {
    store.location = value;
    const parts = value
      .split(",")
      .map((piece) => piece.trim())
      .filter(Boolean);
    if (parts[0]) {
      store.displayCity = parts[0];
    }
    if (parts.length > 1) {
      store.displayCountry = parts[parts.length - 1];
    }
  },
});

const { locationSuggestions, isLocationSearching } = useLocationAutocomplete(
  locationModel,
  locationFocused,
);

const themeModel = computed({
  get: () => store.selectedThemeId,
  set: (value: string) => store.setTheme(value),
});

const sizeModel = computed<PosterSizeId>({
  get: () => store.selectedSizeId,
  set: (value: PosterSizeId) => store.setSize(value),
});

const buyButtonLabel = computed(() => {
  if (store.isCheckoutLoading) {
    return "Preparing checkout...";
  }
  if (store.isExporting) {
    return "Preparing your print...";
  }

  return `Buy Print - ${formatUsd(store.selectedSize.defaultPriceCents)}`;
});

const autoCoordinates = computed(() =>
  formatCoordinates(store.latitude, store.longitude),
);

const effectiveShapeScale = computed(() => store.mapShapeScale ?? 1);

const fontOptions = [
  "Montserrat",
  "Playfair Display",
  "Oswald",
  "Noto Sans JP",
  "Source Sans Pro",
  "Raleway",
  "Lato",
  "Merriweather",
  "Bebas Neue",
  "Poppins",
  "Cormorant Garamond",
];

function resolveColor(key: string): string {
  return (
    store.customColors[key] ||
    getThemeColorByPath(store.selectedThemeBase, key) ||
    "#000000"
  );
}

function onColorInput(key: string, event: Event) {
  const value = (event.target as HTMLInputElement).value;
  store.setCustomColor(key, value);
}

function handleLocationBlur() {
  window.setTimeout(() => {
    locationFocused.value = false;
  }, 120);
}

function clearLocation() {
  store.location = "";
  store.displayCity = "";
  store.displayCountry = "";
}

function selectLocation(suggestion: SearchResult) {
  store.applyLocationResult(suggestion);
  locationFocused.value = false;
  emit("location-selected", suggestion.lat, suggestion.lon);
}

function distanceToSliderValue(distanceMeters: number) {
  const minLog = Math.log(1000);
  const maxLog = Math.log(20_000_000);
  const ratio = (Math.log(Math.max(1000, Math.min(distanceMeters, 20_000_000))) - minLog) / (maxLog - minLog);
  return Math.round(ratio * 1000);
}

function sliderValueToDistance(sliderValue: number) {
  const minLog = Math.log(1000);
  const maxLog = Math.log(20_000_000);
  const ratio = sliderValue / 1000;
  const distance = Math.exp(minLog + ratio * (maxLog - minLog));

  if (distance < 100_000) return Math.round(distance / 100) * 100;
  if (distance < 1_000_000) return Math.round(distance / 1_000) * 1_000;
  if (distance < 10_000_000) return Math.round(distance / 10_000) * 10_000;
  return Math.round(distance / 50_000) * 50_000;
}

const distanceSliderValue = computed(() => distanceToSliderValue(store.distance));

const distanceFillPercent = computed(() => (distanceSliderValue.value / 1000) * 100);

const shapeScaleFillPercent = computed(
  () => ((effectiveShapeScale.value - 0.5) / 1) * 100,
);

const rotationFillPercent = computed(
  () => ((store.mapBearing + 180) / 360) * 100,
);

const textSpacingFillPercent = computed(
  () => ((store.textSpacing - 0.5) / 1) * 100,
);

const pinSizeFillPercent = computed(
  () =>
    ((store.pinSize - PIN_SIZE_MIN) / (PIN_SIZE_MAX - PIN_SIZE_MIN)) * 100,
);

function onDistanceSlider(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  store.setDistance(sliderValueToDistance(value));
}

function onDistanceInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  store.setDistance(value);
}

function onShapeBgColorInput(event: Event) {
  store.shapeBackgroundColor = (event.target as HTMLInputElement).value;
}

function onRotationInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  store.setMapBearing(value);
}

function onPinColorInput(event: Event) {
  store.pinColor = (event.target as HTMLInputElement).value;
}

function onPinSizeInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  store.setPinSize(value);
}

function onMapShapeScaleInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  store.setMapShapeScale(value);
}

function onTextSpacingInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  store.setTextSpacing(value);
}
</script>

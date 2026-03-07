<template>
  <form class="customizer-layout" @submit.prevent>
    <aside class="settings-scroll-col">
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
      <label class="toggle-field">
        <span>Pan & zoom</span>
        <input type="checkbox" :checked="store.editMode === 'map'" @change="store.editMode === 'map' ? store.setEditMode('none') : store.setEditMode('map')" />
      </label>
      <label>Theme</label>
      <div class="theme-carousel-track-wrap">
        <div
          ref="themeTrackRef"
          class="theme-carousel-track"
          @scroll.passive="updateThemeScrollState"
        >
          <button
            v-for="(t, idx) in allThemePreviews"
            :key="t.id"
            :ref="(el) => { if (el) themeItemRefs[idx] = el as HTMLElement }"
            type="button"
            :class="['theme-carousel-item', { 'is-active': store.selectedThemeId === t.id }]"
            @click="store.setTheme(t.id)"
          >
            <svg class="theme-carousel-thumb" viewBox="0 0 60 80">
              <rect width="60" height="80" :fill="t.resolved.ui.bg" rx="2"/>
              <rect x="4" y="4" width="52" height="56" :fill="t.resolved.map.land" rx="1"/>
              <path d="M4 38 Q18 28 32 38 Q48 50 56 36 V60 H4 Z" :fill="t.resolved.map.water" opacity="0.9"/>
              <rect x="36" y="10" width="9" height="7" :fill="t.resolved.map.parks" rx="1"/>
              <rect x="34" y="19" width="6" height="5" :fill="t.resolved.map.parks" rx="0.5"/>
              <line x1="14" y1="4" x2="14" y2="60" :stroke="t.resolved.map.roads.major" stroke-width="1.5"/>
              <line x1="4" y1="22" x2="56" y2="22" :stroke="t.resolved.map.roads.minor_high" stroke-width="1"/>
              <line x1="30" y1="4" x2="44" y2="36" :stroke="t.resolved.map.roads.minor_mid" stroke-width="0.8"/>
              <line x1="4" y1="48" x2="28" y2="44" :stroke="t.resolved.map.roads.minor_low" stroke-width="0.6"/>
              <rect x="18" y="10" width="5" height="4" :fill="t.resolved.map.buildings" rx="0.3"/>
              <rect x="24" y="26" width="4" height="3" :fill="t.resolved.map.buildings" rx="0.3"/>
              <rect x="7" y="28" width="3" height="5" :fill="t.resolved.map.buildings" rx="0.3"/>
              <rect x="18" y="15" width="3" height="3" :fill="t.resolved.map.buildings" rx="0.3"/>
              <rect x="12" y="66" width="36" height="2.5" :fill="t.resolved.ui.text" rx="0.5"/>
              <rect x="18" y="72" width="24" height="1.5" :fill="t.resolved.ui.text" opacity="0.5" rx="0.5"/>
            </svg>
            <span class="theme-carousel-name">{{ t.name }}</span>
          </button>
        </div>
        <button
          type="button"
          class="theme-carousel-arrow arrow-left"
          :disabled="!canScrollThemePrev"
          aria-label="Scroll themes left"
          @click="scrollThemeCarousel('prev')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          class="theme-carousel-arrow arrow-right"
          :disabled="!canScrollThemeNext"
          aria-label="Scroll themes right"
          @click="scrollThemeCarousel('next')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div class="theme-colors-expandable">
        <button type="button" class="theme-colors-toggle" @click="themeColorsOpen = !themeColorsOpen">
          <span>Customize theme colors</span>
          <svg class="theme-colors-chevron" :class="{ 'is-open': themeColorsOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div v-if="themeColorsOpen" class="theme-colors-body">
          <button type="button" class="ghost theme-colors-reset" @click="store.resetCustomColors()">
            Reset colors
          </button>
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
        </div>
      </div>

      <div class="distance-slider-block">
        <label>
          Distance (meters)
          <input
            :value="store.distance"
            class="distance-slider-input"
            type="number"
            min="100"
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

      <div class="distance-slider-block">
        <label>
          Rotation (degrees)
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

      <div class="distance-slider-block">
        <label>
          Tilt (degrees)
          <input
            :value="store.mapPitch"
            class="distance-slider-input"
            type="number"
            min="0"
            max="85"
            step="1"
            @input="onPitchInput"
          />
        </label>
        <div class="slider-wrap" :style="{ '--fill-percent': pitchFillPercent + '%' }">
          <input
            class="distance-slider"
            type="range"
            min="0"
            max="85"
            step="1"
            :value="store.mapPitch"
            @input="onPitchInput"
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
      <label v-if="store.mapShape !== 'none'" class="toggle-field">
        <span>Reposition shape</span>
        <input type="checkbox" :checked="store.editMode === 'shape'" @change="store.editMode === 'shape' ? store.setEditMode('none') : store.setEditMode('shape')" />
      </label>
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

    </section>

    <section class="panel-block">
      <h2>Typography</h2>
      <label v-if="store.showAnyText" class="toggle-field">
        <span>Reposition text</span>
        <input type="checkbox" :checked="store.editMode === 'text'" @change="store.editMode === 'text' ? store.setEditMode('none') : store.setEditMode('text')" />
      </label>
      <label>Text presets</label>
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
          Vertical text spacing
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

      <div class="map-details-card typography-toggles">
        <!-- Title -->
        <div class="typography-toggle-group">
          <label class="toggle-field">
            <span>Title</span>
            <input v-model="store.showTitle" type="checkbox" />
          </label>
          <button v-if="store.showTitle" type="button" class="typography-expand-btn" @click="titleSettingsOpen = !titleSettingsOpen">
            <svg class="theme-colors-chevron" :class="{ 'is-open': titleSettingsOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <div v-if="store.showTitle && titleSettingsOpen" class="typography-settings">
          <label>
            Font family
            <select :value="store.titleFontFamily" class="form-control-tall" @change="store.titleFontFamily = ($event.target as HTMLSelectElement).value">
              <option value="">Default</option>
              <option v-for="f in fontOptions" :key="f" :value="f">{{ f }}</option>
            </select>
          </label>
          <div class="distance-slider-block">
            <label>
              Text size
              <input :value="effectiveTitleSizeScale" class="distance-slider-input" type="number" min="0.5" max="2" step="0.05" @input="onTitleSizeScaleInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': ((effectiveTitleSizeScale - 0.5) / 1.5) * 100 + '%' }">
              <input class="distance-slider" type="range" min="0.5" max="2" step="0.05" :value="effectiveTitleSizeScale" @input="onTitleSizeScaleInput" />
            </div>
          </div>
          <div class="distance-slider-block">
            <label>
              Text weight
              <input :value="effectiveTitleWeight" class="distance-slider-input" type="number" min="100" max="900" step="100" @input="onTitleWeightInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': ((effectiveTitleWeight - 100) / 800) * 100 + '%' }">
              <input class="distance-slider" type="range" min="100" max="900" step="100" :value="effectiveTitleWeight" @input="onTitleWeightInput" />
            </div>
          </div>
          <div class="distance-slider-block">
            <label>
              Letter spacing
              <input :value="effectiveTitleLetterSpacing" class="distance-slider-input" type="number" min="0" max="0.3" step="0.01" @input="onTitleLetterSpacingInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': (effectiveTitleLetterSpacing / 0.3) * 100 + '%' }">
              <input class="distance-slider" type="range" min="0" max="0.3" step="0.01" :value="effectiveTitleLetterSpacing" @input="onTitleLetterSpacingInput" />
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="typography-toggle-group">
          <label class="toggle-field">
            <span>Divider</span>
            <input v-model="store.showDivider" type="checkbox" />
          </label>
          <button v-if="store.showDivider" type="button" class="typography-expand-btn" @click="dividerSettingsOpen = !dividerSettingsOpen">
            <svg class="theme-colors-chevron" :class="{ 'is-open': dividerSettingsOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <div v-if="store.showDivider && dividerSettingsOpen" class="typography-settings">
          <div class="distance-slider-block">
            <label>
              Length
              <input :value="effectiveDividerLength" class="distance-slider-input" type="number" min="0.05" max="0.8" step="0.05" @input="onDividerLengthInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': ((effectiveDividerLength - 0.05) / 0.75) * 100 + '%' }">
              <input class="distance-slider" type="range" min="0.05" max="0.8" step="0.05" :value="effectiveDividerLength" @input="onDividerLengthInput" />
            </div>
          </div>
        </div>

        <!-- Subtitle -->
        <div class="typography-toggle-group">
          <label class="toggle-field">
            <span>Subtitle</span>
            <input v-model="store.showSubtitle" type="checkbox" />
          </label>
          <button v-if="store.showSubtitle" type="button" class="typography-expand-btn" @click="subtitleSettingsOpen = !subtitleSettingsOpen">
            <svg class="theme-colors-chevron" :class="{ 'is-open': subtitleSettingsOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <div v-if="store.showSubtitle && subtitleSettingsOpen" class="typography-settings">
          <label>
            Font family
            <select :value="store.subtitleFontFamily" class="form-control-tall" @change="store.subtitleFontFamily = ($event.target as HTMLSelectElement).value">
              <option value="">Default</option>
              <option v-for="f in fontOptions" :key="f" :value="f">{{ f }}</option>
            </select>
          </label>
          <div class="distance-slider-block">
            <label>
              Text size
              <input :value="effectiveSubtitleSizeScale" class="distance-slider-input" type="number" min="0.5" max="2" step="0.05" @input="onSubtitleSizeScaleInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': ((effectiveSubtitleSizeScale - 0.5) / 1.5) * 100 + '%' }">
              <input class="distance-slider" type="range" min="0.5" max="2" step="0.05" :value="effectiveSubtitleSizeScale" @input="onSubtitleSizeScaleInput" />
            </div>
          </div>
          <div class="distance-slider-block">
            <label>
              Text weight
              <input :value="effectiveSubtitleWeight" class="distance-slider-input" type="number" min="100" max="900" step="100" @input="onSubtitleWeightInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': ((effectiveSubtitleWeight - 100) / 800) * 100 + '%' }">
              <input class="distance-slider" type="range" min="100" max="900" step="100" :value="effectiveSubtitleWeight" @input="onSubtitleWeightInput" />
            </div>
          </div>
          <div class="distance-slider-block">
            <label>
              Letter spacing
              <input :value="effectiveSubtitleLetterSpacing" class="distance-slider-input" type="number" min="0" max="0.3" step="0.01" @input="onSubtitleLetterSpacingInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': (effectiveSubtitleLetterSpacing / 0.3) * 100 + '%' }">
              <input class="distance-slider" type="range" min="0" max="0.3" step="0.01" :value="effectiveSubtitleLetterSpacing" @input="onSubtitleLetterSpacingInput" />
            </div>
          </div>
        </div>

        <!-- Coordinates -->
        <div class="typography-toggle-group">
          <label class="toggle-field">
            <span>Coordinates</span>
            <input v-model="store.showCoordinates" type="checkbox" />
          </label>
          <button v-if="store.showCoordinates" type="button" class="typography-expand-btn" @click="coordsSettingsOpen = !coordsSettingsOpen">
            <svg class="theme-colors-chevron" :class="{ 'is-open': coordsSettingsOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <div v-if="store.showCoordinates && coordsSettingsOpen" class="typography-settings">
          <label>
            Font family
            <select :value="store.coordsFontFamily" class="form-control-tall" @change="store.coordsFontFamily = ($event.target as HTMLSelectElement).value">
              <option value="">Default</option>
              <option v-for="f in fontOptions" :key="f" :value="f">{{ f }}</option>
            </select>
          </label>
          <div class="distance-slider-block">
            <label>
              Text size
              <input :value="effectiveCoordsSizeScale" class="distance-slider-input" type="number" min="0.5" max="2" step="0.05" @input="onCoordsSizeScaleInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': ((effectiveCoordsSizeScale - 0.5) / 1.5) * 100 + '%' }">
              <input class="distance-slider" type="range" min="0.5" max="2" step="0.05" :value="effectiveCoordsSizeScale" @input="onCoordsSizeScaleInput" />
            </div>
          </div>
          <div class="distance-slider-block">
            <label>
              Text weight
              <input :value="effectiveCoordsWeight" class="distance-slider-input" type="number" min="100" max="900" step="100" @input="onCoordsWeightInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': ((effectiveCoordsWeight - 100) / 800) * 100 + '%' }">
              <input class="distance-slider" type="range" min="100" max="900" step="100" :value="effectiveCoordsWeight" @input="onCoordsWeightInput" />
            </div>
          </div>
          <div class="distance-slider-block">
            <label>
              Letter spacing
              <input :value="effectiveCoordsLetterSpacing" class="distance-slider-input" type="number" min="0" max="0.3" step="0.01" @input="onCoordsLetterSpacingInput" />
            </label>
            <div class="slider-wrap" :style="{ '--fill-percent': (effectiveCoordsLetterSpacing / 0.3) * 100 + '%' }">
              <input class="distance-slider" type="range" min="0" max="0.3" step="0.01" :value="effectiveCoordsLetterSpacing" @input="onCoordsLetterSpacingInput" />
            </div>
          </div>
        </div>
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
    </section>

    <section class="panel-block">
      <h2>Map Pin</h2>
      <label class="toggle-field">
        <span>Show pin</span>
        <input v-model="store.showPin" type="checkbox" />
      </label>
      <label v-if="store.showPin" class="toggle-field">
        <span>Reposition pin</span>
        <input type="checkbox" :checked="store.editMode === 'pin'" @change="store.editMode === 'pin' ? store.setEditMode('none') : store.setEditMode('pin')" />
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
    </aside>

    <div class="poster-col">
      <slot />
    </div>

    <aside class="settings-print-col">
    <div class="settings-fixed">
      <AspectRatioSelector
        v-model="aspectRatioModel"
        :ratios="ASPECT_RATIOS"
      />

      <div class="action-row">
        <NuxtLink to="/print" class="generate-btn preview-print-link">
          Preview Print Options →
        </NuxtLink>
      </div>

      <div class="export-row export-row-top">
        <!-- PNG with resolution dropdown -->
        <div class="dropdown-btn-wrap">
          <button
            type="button"
            class="export-btn has-dropdown"
            :disabled="store.isExporting"
            @click.stop="pngDropdownOpen = !pngDropdownOpen; allPngDropdownOpen = false"
            title="Download PNG"
          >
            <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>PNG</span>
            <svg class="dropdown-chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="2 4 6 8 10 4" /></svg>
          </button>
          <div v-if="pngDropdownOpen" class="dropdown-menu">
            <button
              v-for="preset in PNG_RESOLUTION_PRESETS"
              :key="preset.id"
              type="button"
              class="dropdown-menu-item"
              @click="selectPngResAndDownload(preset.id)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- SVG -->
        <button
          type="button"
          class="export-btn"
          :disabled="store.isExporting"
          @click="$emit('download-svg')"
          title="Download SVG"
        >
          <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>SVG</span>
        </button>
      </div>

      <div class="export-row export-row-full">
        <!-- All Themes PNG with resolution dropdown - full width -->
        <div class="dropdown-btn-wrap">
          <button
            type="button"
            class="export-btn has-dropdown"
            :disabled="store.isExporting"
            @click.stop="allPngDropdownOpen = !allPngDropdownOpen; pngDropdownOpen = false"
            title="Download PNGs for All Themes"
          >
            <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>All Themes (PNG)</span>
            <svg class="dropdown-chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="2 4 6 8 10 4" /></svg>
          </button>
          <div v-if="allPngDropdownOpen" class="dropdown-menu">
            <button
              v-for="preset in PNG_RESOLUTION_PRESETS"
              :key="preset.id"
              type="button"
              class="dropdown-menu-item"
              @click="selectAllPngResAndDownload(preset.id)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="export-row export-row-top">
        <!-- All Themes SVG -->
        <button
          type="button"
          class="export-btn"
          :disabled="store.isExporting"
          @click="$emit('download-all-svg')"
          title="Download SVGs for All Themes"
        >
          <svg class="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>All Themes (SVG)</span>
        </button>

        <!-- Share -->
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
      </div>

      <p v-if="shareCopied" class="success-note">Link copied to clipboard!</p>
      <p v-else-if="store.error" class="error">{{ store.error }}</p>
    </div>
    </aside>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import AspectRatioSelector from "~/components/AspectRatioSelector.vue";
import { useLocationAutocomplete } from "~/composables/useLocationAutocomplete";
import { useMapStore } from "~/stores/map";
import { ASPECT_RATIOS, PNG_RESOLUTION_PRESETS } from "~~/shared/aspectRatios";
import {
  DISPLAY_PALETTE_KEYS,
  PALETTE_COLOR_LABELS,
} from "~/lib/theme/types";
import { getThemeColorByPath } from "~/lib/theme/colorPaths";
import { themeOptions, getTheme } from "~/lib/theme/themeRepository";
import { PIN_STYLES, PIN_SIZE_MIN, PIN_SIZE_MAX } from "~/lib/pin/pinStyles";
import { MAP_SHAPES } from "~/lib/shapes/mapShapes";
import { TEXT_PRESETS } from "~/lib/text/textPresets";
import { formatCoordinates } from "~/lib/location/coordinates";
import type { SearchResult } from "~/lib/location/nominatim";

defineProps<{
  shareCopied?: boolean;
}>();

const emit = defineEmits<{
  "location-selected": [lat: number, lon: number];
  "download-png": [];
  "download-svg": [];
  "download-all-png": [];
  "download-all-svg": [];
  share: [];
}>();

const store = useMapStore();
const locationFocused = ref(false);
const themeColorsOpen = ref(false);
const titleSettingsOpen = ref(false);
const dividerSettingsOpen = ref(false);
const subtitleSettingsOpen = ref(false);
const coordsSettingsOpen = ref(false);

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
      store.displayCountry = parts[parts.length - 1] ?? "";
    }
  },
});

const { locationSuggestions, isLocationSearching } = useLocationAutocomplete(
  locationModel,
  locationFocused,
);

const allThemePreviews = computed(() =>
  themeOptions.map((t) => ({
    id: t.id,
    name: t.name,
    resolved: getTheme(t.id),
  })),
);

const themeTrackRef = ref<HTMLElement | null>(null);
const themeItemRefs = ref<Record<number, HTMLElement>>({});
const canScrollThemePrev = ref(false);
const canScrollThemeNext = ref(false);

// PNG resolution dropdown state
const pngDropdownOpen = ref(false);
const allPngDropdownOpen = ref(false);

function closeAllDropdowns() {
  pngDropdownOpen.value = false;
  allPngDropdownOpen.value = false;
}

function handlePngDownload() {
  closeAllDropdowns();
  emit("download-png");
}

function handleAllPngDownload() {
  closeAllDropdowns();
  emit("download-all-png");
}

function selectPngResAndDownload(resId: string) {
  store.setPngResolution(resId);
  pngDropdownOpen.value = false;
  emit("download-png");
}

function selectAllPngResAndDownload(resId: string) {
  store.setPngResolution(resId);
  allPngDropdownOpen.value = false;
  emit("download-all-png");
}

function onDocClick() {
  closeAllDropdowns();
}

function updateThemeScrollState() {
  const track = themeTrackRef.value;
  if (!track) {
    canScrollThemePrev.value = false;
    canScrollThemeNext.value = false;
    return;
  }

  const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
  canScrollThemePrev.value = track.scrollLeft > 2;
  canScrollThemeNext.value = track.scrollLeft < maxScrollLeft - 2;
}

function scrollThemeCarousel(direction: "prev" | "next") {
  const track = themeTrackRef.value;
  if (!track) return;

  const firstItem = themeItemRefs.value[0];
  const itemWidth = firstItem?.offsetWidth ?? 62;
  const scrollBy = (itemWidth + 8) * 2;
  const nextLeft = direction === "prev"
    ? track.scrollLeft - scrollBy
    : track.scrollLeft + scrollBy;

  track.scrollTo({ left: nextLeft, behavior: "smooth" });
}

function scrollToActiveTheme() {
  const idx = themeOptions.findIndex((t) => t.id === store.selectedThemeId);
  const el = themeItemRefs.value[idx];
  if (el && themeTrackRef.value) {
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  window.setTimeout(updateThemeScrollState, 180);
}

watch(() => store.selectedThemeId, () => nextTick(scrollToActiveTheme));
onMounted(() => {
  nextTick(() => {
    scrollToActiveTheme();
    updateThemeScrollState();
  });
  window.addEventListener("resize", updateThemeScrollState);
  document.addEventListener("click", onDocClick);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateThemeScrollState);
  document.removeEventListener("click", onDocClick);
});

const aspectRatioModel = computed<string>({
  get: () => store.selectedAspectRatioId,
  set: (value: string) => store.setAspectRatio(value),
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
  const minLog = Math.log(100);
  const maxLog = Math.log(20_000_000);
  const ratio = (Math.log(Math.max(100, Math.min(distanceMeters, 20_000_000))) - minLog) / (maxLog - minLog);
  return Math.round(ratio * 1000);
}

function sliderValueToDistance(sliderValue: number) {
  const minLog = Math.log(100);
  const maxLog = Math.log(20_000_000);
  const ratio = sliderValue / 1000;
  const distance = Math.exp(minLog + ratio * (maxLog - minLog));

  if (distance < 2_000) return Math.round(distance / 10) * 10;
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

const pitchFillPercent = computed(
  () => (store.mapPitch / 85) * 100,
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

function onPitchInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  store.setMapPitch(value);
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

// Per-element effective values (fall back to preset)
const effectiveTitleSizeScale = computed(() => store.titleSizeScale ?? store.effectiveTextPreset.citySizeScale);
const effectiveTitleWeight = computed(() => store.titleWeight ?? store.effectiveTextPreset.cityWeight);
const effectiveSubtitleSizeScale = computed(() => store.subtitleSizeScale ?? store.effectiveTextPreset.countrySizeScale);
const effectiveSubtitleWeight = computed(() => store.subtitleWeight ?? store.effectiveTextPreset.countryWeight);
const effectiveCoordsSizeScale = computed(() => store.coordsSizeScale ?? store.effectiveTextPreset.coordsSizeScale);
const effectiveCoordsWeight = computed(() => store.coordsWeight ?? store.effectiveTextPreset.coordsWeight);
const effectiveDividerLength = computed(() => store.dividerLength ?? 0.2);

function onNumericOverride(event: Event, setter: (v: number) => void) {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  setter(value);
}
const onTitleSizeScaleInput = (e: Event) => onNumericOverride(e, (v) => { store.titleSizeScale = v; });
const onTitleWeightInput = (e: Event) => onNumericOverride(e, (v) => { store.titleWeight = v; });
const onSubtitleSizeScaleInput = (e: Event) => onNumericOverride(e, (v) => { store.subtitleSizeScale = v; });
const onSubtitleWeightInput = (e: Event) => onNumericOverride(e, (v) => { store.subtitleWeight = v; });
const onCoordsSizeScaleInput = (e: Event) => onNumericOverride(e, (v) => { store.coordsSizeScale = v; });
const onCoordsWeightInput = (e: Event) => onNumericOverride(e, (v) => { store.coordsWeight = v; });
const onDividerLengthInput = (e: Event) => onNumericOverride(e, (v) => { store.dividerLength = v; });

function parseEmValue(val: string | null | undefined): number {
  if (!val) return 0;
  return parseFloat(val) || 0;
}

const effectiveTitleLetterSpacing = computed(() =>
  store.titleLetterSpacing != null ? parseEmValue(store.titleLetterSpacing) : parseEmValue(store.effectiveTextPreset.cityLetterSpacing),
);
const effectiveSubtitleLetterSpacing = computed(() =>
  store.subtitleLetterSpacing != null ? parseEmValue(store.subtitleLetterSpacing) : parseEmValue(store.effectiveTextPreset.countryLetterSpacing),
);
const effectiveCoordsLetterSpacing = computed(() =>
  store.coordsLetterSpacing != null ? parseEmValue(store.coordsLetterSpacing) : parseEmValue(store.effectiveTextPreset.coordsLetterSpacing),
);

const onTitleLetterSpacingInput = (e: Event) => {
  const v = Number((e.target as HTMLInputElement).value);
  if (!Number.isFinite(v)) return;
  store.titleLetterSpacing = `${v}em`;
};
const onSubtitleLetterSpacingInput = (e: Event) => {
  const v = Number((e.target as HTMLInputElement).value);
  if (!Number.isFinite(v)) return;
  store.subtitleLetterSpacing = `${v}em`;
};
const onCoordsLetterSpacingInput = (e: Event) => {
  const v = Number((e.target as HTMLInputElement).value);
  if (!Number.isFinite(v)) return;
  store.coordsLetterSpacing = `${v}em`;
};
</script>

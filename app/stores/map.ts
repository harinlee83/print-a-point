import { defineStore } from "pinia";
import { DEFAULT_POSTER_SIZE_ID, getPosterSizeById } from "~~/shared/posterSizes";
import {
  DEFAULT_ASPECT_RATIO_ID,
  ASPECT_RATIO_IDS,
  getAspectRatioById,
  DEFAULT_PNG_RESOLUTION_ID,
  PNG_RESOLUTION_PRESETS,
} from "~~/shared/aspectRatios";
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_IDS,
  getProductTypeById,
  getAvailableSizes,
  type ProductTypeId,
  type FrameColorId,
} from "~~/shared/productCatalog";
import { applyThemeColorOverrides } from "~/lib/theme/colorPaths";
import {
  defaultThemeName,
  getTheme,
  themeNames,
} from "~/lib/theme/themeRepository";
import { generateMapStyle } from "~/lib/map/maplibreStyle";
import type { ResolvedTheme } from "~/lib/theme/types";
import type { SearchResult } from "~/lib/location/nominatim";
import { getPinStyleById, PIN_SIZE_MIN, PIN_SIZE_MAX } from "~/lib/pin/pinStyles";
import { getMapShapeById, DEFAULT_MAP_SHAPE_ID } from "~/lib/shapes/mapShapes";
import { getTextPresetById, resolveTextPreset, DEFAULT_TEXT_PRESET_ID, type TextPreset } from "~/lib/text/textPresets";

export const DEFAULT_LAT = 52.3759;
export const DEFAULT_LON = 9.732;
export const DEFAULT_LOCATION_LABEL =
  "Hanover, Region Hannover, Lower Saxony, Germany";

export const useMapStore = defineStore("map", {
  state: () => ({
    location: DEFAULT_LOCATION_LABEL,
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LON,
    distance: 4_000,

    displayCity: "Hanover",
    displayCountry: "Germany",
    displayContinent: "Europe",

    selectedThemeId: defaultThemeName,
    customColors: {} as Record<string, string>,

    selectedProductType: "poster" as ProductTypeId,
    selectedFrameColor: "black" as FrameColorId,
    selectedSizeId: DEFAULT_POSTER_SIZE_ID,
    selectedAspectRatioId: DEFAULT_ASPECT_RATIO_ID,
    selectedOrientation: "portrait" as "portrait" | "landscape",
    selectedPngResolutionId: DEFAULT_PNG_RESOLUTION_ID,

    fontFamily: "",
    showTitle: true,
    showDivider: true,
    showSubtitle: true,
    showCoordinates: true,
    displayCoordinates: "",

    mapShape: DEFAULT_MAP_SHAPE_ID,
    mapShapeScale: 1,
    mapShapeOffsetX: 0,
    mapShapeOffsetY: 0,
    shapeBackgroundColor: "",
    mapBearing: 0,
    mapPitch: 0,
    textPresetId: DEFAULT_TEXT_PRESET_ID,
    textSpacing: 1,
    textOffsetX: 0,
    textOffsetY: 0,

    // Per-element typography overrides (null/empty = use text preset default)
    titleFontFamily: "" as string,
    titleSizeScale: null as number | null,
    titleWeight: null as number | null,
    titleLetterSpacing: null as string | null,
    subtitleFontFamily: "" as string,
    subtitleSizeScale: null as number | null,
    subtitleWeight: null as number | null,
    subtitleLetterSpacing: null as string | null,
    coordsFontFamily: "" as string,
    coordsSizeScale: null as number | null,
    coordsWeight: null as number | null,
    coordsLetterSpacing: null as string | null,
    dividerLength: null as number | null,

    showPin: false,
    pinStyleId: "classic",
    pinColor: "",
    pinSize: 50,
    pinOffsetX: 0,
    pinOffsetY: 0,

    includeBuildings: false,
    includeWater: true,
    includeParks: true,

    isExporting: false,
    isCheckoutLoading: false,
    isHydratingLocation: false,

    /** Edit mode: none | map | shape | text | pin */
    editMode: "map" as "none" | "map" | "shape" | "text" | "pin",

    error: "",
  }),

  getters: {
    selectedProduct(state) {
      return getProductTypeById(state.selectedProductType);
    },

    availableSizes(state) {
      return getAvailableSizes(state.selectedProductType, state.selectedFrameColor);
    },

    selectedVariant(state) {
      const sizes = getAvailableSizes(state.selectedProductType, state.selectedFrameColor);
      const currentSize = getPosterSizeById(state.selectedSizeId);
      const current = currentSize
        ? sizes.find((v) => v.sizeLabel === currentSize.label)
        : undefined;
      return current ?? sizes[0];
    },

    needsFrameSelection(state) {
      return getProductTypeById(state.selectedProductType).hasFrameOptions;
    },

    selectedSize(state) {
      const size = getPosterSizeById(state.selectedSizeId) || getPosterSizeById(DEFAULT_POSTER_SIZE_ID)!;
      if (state.selectedOrientation === "landscape") {
        return {
          ...size,
          widthInches: size.heightInches,
          heightInches: size.widthInches,
          widthCm: size.heightCm,
          heightCm: size.widthCm,
          targetWidthPx: size.targetHeightPx,
          targetHeightPx: size.targetWidthPx,
        };
      }
      return size;
    },

    aspectRatio(state): number {
      const ratio = getAspectRatioById(state.selectedAspectRatioId);
      if (ratio) {
        const base = ratio.w / ratio.h;
        return state.selectedOrientation === "landscape" ? 1 / base : base;
      }
      // Fallback to product variant
      const sizes = getAvailableSizes(state.selectedProductType, state.selectedFrameColor);
      const currentSize = getPosterSizeById(state.selectedSizeId);
      const variant = currentSize
        ? sizes.find((v) => v.sizeLabel === currentSize.label)
        : sizes[0];
      if (variant) {
        const base = variant.widthInches / variant.heightInches;
        return state.selectedOrientation === "landscape" ? 1 / base : base;
      }
      const size = getPosterSizeById(state.selectedSizeId) || getPosterSizeById(DEFAULT_POSTER_SIZE_ID)!;
      const base = size.widthInches / size.heightInches;
      return state.selectedOrientation === "landscape" ? 1 / base : base;
    },

    selectedPngResolution(state): number {
      const preset = PNG_RESOLUTION_PRESETS.find((p) => p.id === state.selectedPngResolutionId);
      return preset?.widthPx ?? 2048;
    },

    selectedThemeBase(state) {
      const safeTheme = themeNames.includes(state.selectedThemeId)
        ? state.selectedThemeId
        : defaultThemeName;
      return getTheme(safeTheme);
    },

    effectiveTheme(): ResolvedTheme {
      return applyThemeColorOverrides(this.selectedThemeBase, this.customColors);
    },

    mapStyle(): any {
      return generateMapStyle(this.effectiveTheme, {
        includeBuildings: this.includeBuildings,
        includeWater: this.includeWater,
        includeParks: this.includeParks,
        distanceMeters: this.distance,
      });
    },

    effectivePinColor(state): string {
      return state.pinColor || this.effectiveTheme.ui.text;
    },

    showAnyText(state): boolean {
      return state.showTitle || state.showDivider || state.showSubtitle || state.showCoordinates;
    },

    effectiveTextPreset(state): TextPreset {
      const base = resolveTextPreset(state.textPresetId);
      return {
        ...base,
        ...(state.titleSizeScale != null && { citySizeScale: state.titleSizeScale }),
        ...(state.titleWeight != null && { cityWeight: state.titleWeight }),
        ...(state.titleLetterSpacing != null && { cityLetterSpacing: state.titleLetterSpacing }),
        ...(state.subtitleSizeScale != null && { countrySizeScale: state.subtitleSizeScale }),
        ...(state.subtitleWeight != null && { countryWeight: state.subtitleWeight }),
        ...(state.subtitleLetterSpacing != null && { countryLetterSpacing: state.subtitleLetterSpacing }),
        ...(state.coordsSizeScale != null && { coordsSizeScale: state.coordsSizeScale }),
        ...(state.coordsWeight != null && { coordsWeight: state.coordsWeight }),
        ...(state.coordsLetterSpacing != null && { coordsLetterSpacing: state.coordsLetterSpacing }),
      };
    },

    mapCenter(state): [number, number] {
      return [state.longitude, state.latitude];
    },
  },

  actions: {
    setError(message: string) {
      this.error = message;
    },

    clearError() {
      this.error = "";
    },

    setTheme(themeId: string) {
      if (!themeNames.includes(themeId)) {
        return;
      }
      this.selectedThemeId = themeId;
      this.customColors = {};
    },

    setSize(sizeId: string) {
      if (!getPosterSizeById(sizeId)) {
        return;
      }
      this.selectedSizeId = sizeId as typeof this.selectedSizeId;
    },

    setProductType(id: ProductTypeId) {
      if (!PRODUCT_TYPE_IDS.includes(id)) return;
      this.selectedProductType = id;
      // Reset size to first available for this product type
      const sizes = getAvailableSizes(id, this.selectedFrameColor);
      const firstSize = sizes[0];
      if (firstSize) {
        const sizeId = firstSize.sizeLabel.replace(/\s/g, "").replace("x", "x").replace("in", "");
        // Try to match a PosterSizeId
        const match = firstSize;
        if (match) {
          const posterSizeId = `${match.widthInches}x${match.heightInches}`;
          this.selectedSizeId = posterSizeId as any;
        }
      }
    },

    setAspectRatio(id: string) {
      if (!ASPECT_RATIO_IDS.includes(id)) return;
      this.selectedAspectRatioId = id;

      // Sync size to first available for this ratio
      const ratio = getAspectRatioById(id);
      if (ratio && ratio.sizes.length > 0) {
        const size = ratio.sizes[0];
        if (size) {
          this.selectedSizeId = `${size.widthInches}x${size.heightInches}` as any;
        }
      }
    },

    setPngResolution(id: string) {
      if (!PNG_RESOLUTION_PRESETS.find((p) => p.id === id)) return;
      this.selectedPngResolutionId = id;
    },

    setOrientation(orientation: "portrait" | "landscape") {
      this.selectedOrientation = orientation;
    },

    setFrameColor(id: FrameColorId) {
      this.selectedFrameColor = id;
    },

    setCustomColor(key: string, value: string) {
      this.customColors = {
        ...this.customColors,
        [key]: value,
      };
    },

    resetCustomColors() {
      this.customColors = {};
    },

    setCoordinates(lat: number, lon: number) {
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return;
      }
      this.latitude = Number(lat.toFixed(6));
      this.longitude = Number(lon.toFixed(6));
    },

    setDistance(distance: number) {
      if (!Number.isFinite(distance)) {
        return;
      }
      this.distance = Math.max(100, Math.min(Math.round(distance), 20_000_000));
    },

    applyLocationResult(location: SearchResult) {
      this.location = location.label;
      this.latitude = Number(location.lat.toFixed(6));
      this.longitude = Number(location.lon.toFixed(6));
      this.displayCity = location.city || this.displayCity;
      this.displayCountry = location.country || this.displayCountry;
      this.displayContinent = location.continent || this.displayContinent;
    },

    applyLocationLabelParts(city: string, country: string, continent = "") {
      if (city.trim()) {
        this.displayCity = city.trim();
      }
      if (country.trim()) {
        this.displayCountry = country.trim();
      }
      if (continent.trim()) {
        this.displayContinent = continent.trim();
      }
    },

    setMapShape(shapeId: string) {
      if (!getMapShapeById(shapeId)) return;
      this.mapShape = shapeId;
      this.mapShapeOffsetX = 0;
      this.mapShapeOffsetY = 0;
      if (shapeId === "none" && this.editMode === "shape") {
        this.editMode = "none";
      }
    },

    setMapShapeScale(scale: number) {
      if (!Number.isFinite(scale)) return;
      this.mapShapeScale = Math.max(0.5, Math.min(1.5, scale));
    },

    setMapShapeOffset(x: number, y: number) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      this.mapShapeOffsetX = Math.max(-100, Math.min(100, x));
      this.mapShapeOffsetY = Math.max(-100, Math.min(100, y));
    },

    setMapBearing(bearing: number) {
      if (!Number.isFinite(bearing)) return;
      this.mapBearing = Math.max(-180, Math.min(180, bearing));
    },

    setMapPitch(pitch: number) {
      if (!Number.isFinite(pitch)) return;
      this.mapPitch = Math.max(0, Math.min(85, pitch));
    },

    setTextPreset(presetId: string) {
      const preset = getTextPresetById(presetId);
      if (!preset) return;
      this.textPresetId = presetId;
      this.fontFamily = preset.fontFamily;
      this.showDivider = preset.showDividerDefault;
      // Reset per-element overrides
      this.titleFontFamily = "";
      this.titleSizeScale = null;
      this.titleWeight = null;
      this.titleLetterSpacing = null;
      this.subtitleFontFamily = "";
      this.subtitleSizeScale = null;
      this.subtitleWeight = null;
      this.subtitleLetterSpacing = null;
      this.coordsFontFamily = "";
      this.coordsSizeScale = null;
      this.coordsWeight = null;
      this.coordsLetterSpacing = null;
      this.dividerLength = null;
    },

    setTextSpacing(value: number) {
      if (!Number.isFinite(value)) return;
      this.textSpacing = Math.max(0.5, Math.min(1.5, value));
    },

    setTextOffset(x: number, y: number) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      this.textOffsetX = Math.max(-100, Math.min(100, x));
      this.textOffsetY = Math.max(-100, Math.min(100, y));
    },

    setPinStyle(styleId: string) {
      if (!getPinStyleById(styleId)) return;
      this.pinStyleId = styleId;
    },

    setPinSize(size: number) {
      if (!Number.isFinite(size)) return;
      this.pinSize = Math.max(PIN_SIZE_MIN, Math.min(Math.round(size), PIN_SIZE_MAX));
    },

    setPinOffset(x: number, y: number) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      this.pinOffsetX = Math.max(-100, Math.min(100, x));
      this.pinOffsetY = Math.max(-100, Math.min(100, y));
    },

    setIsExporting(value: boolean) {
      this.isExporting = value;
    },

    setIsCheckoutLoading(value: boolean) {
      this.isCheckoutLoading = value;
    },

    setEditMode(mode: "none" | "map" | "shape" | "text" | "pin") {
      this.editMode = mode;
    },

    async hydrateFromGeolocation(resolveNearest?: (lat: number, lon: number) => Promise<SearchResult>) {
      if (!import.meta.client || this.isHydratingLocation) {
        return;
      }

      this.isHydratingLocation = true;

      try {
        if (!navigator.geolocation) {
          return;
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8_000,
            maximumAge: Infinity,
          });
        });

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        this.setCoordinates(lat, lon);

        if (resolveNearest) {
          try {
            const nearest = await resolveNearest(lat, lon);
            this.applyLocationResult(nearest);
          } catch {
            // Keep coordinates even if reverse geocoding fails.
          }
        }
      } catch {
        // Keep defaults when geolocation fails/denied.
      } finally {
        this.isHydratingLocation = false;
      }
    },
  },
});

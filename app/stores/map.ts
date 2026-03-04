import { defineStore } from "pinia";
import { DEFAULT_POSTER_SIZE_ID, getPosterSizeById } from "~~/shared/posterSizes";
import { applyThemeColorOverrides } from "~/lib/theme/colorPaths";
import {
  defaultThemeName,
  getTheme,
  themeNames,
} from "~/lib/theme/themeRepository";
import { generateMapStyle } from "~/lib/map/maplibreStyle";
import type { SearchResult } from "~/lib/location/nominatim";
import { getPinStyleById, PIN_SIZE_MIN, PIN_SIZE_MAX } from "~/lib/pin/pinStyles";

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

    selectedSizeId: DEFAULT_POSTER_SIZE_ID,

    fontFamily: "",
    showPosterText: true,

    showPin: false,
    pinStyleId: "classic",
    pinColor: "",
    pinSize: 50,

    includeBuildings: false,
    includeWater: true,
    includeParks: true,

    isExporting: false,
    isCheckoutLoading: false,
    isHydratingLocation: false,

    error: "",
  }),

  getters: {
    selectedSize(state) {
      return getPosterSizeById(state.selectedSizeId) || getPosterSizeById(DEFAULT_POSTER_SIZE_ID)!;
    },

    aspectRatio(): number {
      const size = this.selectedSize;
      return size.widthInches / size.heightInches;
    },

    selectedThemeBase(state) {
      const safeTheme = themeNames.includes(state.selectedThemeId)
        ? state.selectedThemeId
        : defaultThemeName;
      return getTheme(safeTheme);
    },

    effectiveTheme() {
      return applyThemeColorOverrides(this.selectedThemeBase, this.customColors);
    },

    mapStyle() {
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
      this.distance = Math.max(1_000, Math.min(Math.round(distance), 20_000_000));
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

    setPinStyle(styleId: string) {
      if (!getPinStyleById(styleId)) return;
      this.pinStyleId = styleId;
    },

    setPinSize(size: number) {
      if (!Number.isFinite(size)) return;
      this.pinSize = Math.max(PIN_SIZE_MIN, Math.min(Math.round(size), PIN_SIZE_MAX));
    },

    setIsExporting(value: boolean) {
      this.isExporting = value;
    },

    setIsCheckoutLoading(value: boolean) {
      this.isCheckoutLoading = value;
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

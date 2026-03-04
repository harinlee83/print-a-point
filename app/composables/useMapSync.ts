import { computed, ref, type Ref } from "vue";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useMapStore } from "~/stores/map";
import {
  DEFAULT_CONTAINER_PX,
  EARTH_CIRCUMFERENCE_M,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  TILE_SIZE_PX,
} from "~/lib/map/constants";
import { clamp } from "~/lib/utils/math";
import { reverseGeocode } from "~/lib/location/nominatim";

export function distanceToZoom(
  distanceMeters: number,
  latDeg: number,
  containerPx: number,
): number {
  const phi = (Math.abs(latDeg) * Math.PI) / 180;
  const cosLat = Math.max(0.01, Math.cos(phi));
  const fullWidth = distanceMeters * 2;
  const zoom = Math.log2(
    (EARTH_CIRCUMFERENCE_M * cosLat * containerPx) / (fullWidth * TILE_SIZE_PX),
  );
  return clamp(zoom, MIN_MAP_ZOOM, MAX_MAP_ZOOM);
}

export function zoomToDistance(
  zoom: number,
  latDeg: number,
  containerPx: number,
): number {
  const phi = (Math.abs(latDeg) * Math.PI) / 180;
  const cosLat = Math.max(0.01, Math.cos(phi));
  const fullWidth =
    (EARTH_CIRCUMFERENCE_M * cosLat * containerPx) /
    (Math.pow(2, zoom) * TILE_SIZE_PX);

  return clamp(Math.round(fullWidth / 2), 1_000, 20_000_000);
}

function resolveZoomBounds(
  latDeg: number,
  containerPx: number,
): { minZoom: number; maxZoom: number } {
  const minZoomFromDistance = distanceToZoom(20_000_000, latDeg, containerPx);
  const maxZoomFromDistance = distanceToZoom(1_000, latDeg, containerPx);

  return {
    minZoom: Math.min(minZoomFromDistance, maxZoomFromDistance),
    maxZoom: Math.max(minZoomFromDistance, maxZoomFromDistance),
  };
}

export function useMapSync(mapRef: Ref<MapLibreMap | null>) {
  const store = useMapStore();

  const containerPx = ref(DEFAULT_CONTAINER_PX);
  const lastLookupAt = ref(0);
  const lastLookupCoords = ref<[number, number] | null>(null);
  const lookupSequence = ref(0);

  const mapZoomBounds = computed(() =>
    resolveZoomBounds(store.latitude, containerPx.value),
  );

  const mapCenter = computed<[number, number]>(() => [
    store.longitude,
    store.latitude,
  ]);

  const mapZoom = computed(() =>
    clamp(
      distanceToZoom(store.distance, store.latitude, containerPx.value),
      mapZoomBounds.value.minZoom,
      mapZoomBounds.value.maxZoom,
    ),
  );

  const setContainerWidth = (px: number) => {
    if (px <= 0) return;
    if (Math.abs(containerPx.value - px) < 0.5) return;
    containerPx.value = px;
  };

  const updateLocationFromCoordinates = async (lat: number, lon: number) => {
    const now = Date.now();
    const previous = lastLookupCoords.value;
    const movedEnough =
      !previous ||
      Math.abs(previous[0] - lat) >= 0.002 ||
      Math.abs(previous[1] - lon) >= 0.002;
    const canLookup = now - lastLookupAt.value >= 900;

    if (!movedEnough || !canLookup) {
      return;
    }

    lastLookupCoords.value = [lat, lon];
    lastLookupAt.value = now;
    const currentSeq = ++lookupSequence.value;

    try {
      const nearest = await reverseGeocode(lat, lon);
      if (currentSeq !== lookupSequence.value) {
        return;
      }

      const city = String(nearest.city ?? "").trim();
      const country = String(nearest.country ?? "").trim();
      const continent = String(nearest.continent ?? "").trim();
      const nextLocation =
        [city, country].filter(Boolean).join(", ") || String(nearest.label ?? "").trim();

      if (!nextLocation) {
        return;
      }

      store.location = nextLocation;
      store.displayCity = city;
      store.displayCountry = country;
      store.displayContinent = continent;
    } catch {
      // Ignore reverse geocode errors; map center remains source of truth.
    }
  };

  const handleMove = async (center: [number, number]) => {
    const [lon, lat] = center;
    await updateLocationFromCoordinates(lat, lon);
  };

  const handleMoveEnd = async (center: [number, number], zoom: number) => {
    const [lon, lat] = center;
    const bounds = resolveZoomBounds(lat, containerPx.value);
    const boundedZoom = clamp(zoom, bounds.minZoom, bounds.maxZoom);
    const distance = zoomToDistance(boundedZoom, lat, containerPx.value);

    store.setCoordinates(lat, lon);
    store.setDistance(distance);

    await updateLocationFromCoordinates(lat, lon);
  };

  const flyToLocation = (lat: number, lon: number) => {
    const map = mapRef.value;
    if (!map) return;

    const bounds = resolveZoomBounds(lat, containerPx.value);
    const zoom = clamp(
      distanceToZoom(store.distance, lat, containerPx.value),
      bounds.minZoom,
      bounds.maxZoom,
    );

    map.flyTo({
      center: [lon, lat],
      zoom,
      duration: 1800,
    });
  };

  return {
    mapCenter,
    mapZoom,
    mapMinZoom: computed(() => mapZoomBounds.value.minZoom),
    mapMaxZoom: computed(() => mapZoomBounds.value.maxZoom),
    handleMove,
    handleMoveEnd,
    flyToLocation,
    setContainerWidth,
  };
}

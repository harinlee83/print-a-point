import { useMapStore } from "~/stores/map";
import { themeNames } from "~/lib/theme/themeRepository";
import { getMapShapeById } from "~/lib/shapes/mapShapes";

export function useShareConfig() {
  const route = useRoute();
  const store = useMapStore();

  function buildShareUrl(): string {
    if (!import.meta.client) return "";
    const params = new URLSearchParams();

    params.set("lat", String(store.latitude));
    params.set("lon", String(store.longitude));
    params.set("theme", store.selectedThemeId);
    params.set("city", store.displayCity || store.location.split(",")[0] || "");
    params.set("shape", store.mapShape);
    params.set("distance", String(store.distance));
    params.set("bearing", String(store.mapBearing));
    params.set("size", store.selectedSizeId);
    params.set("pin", store.showPin ? "1" : "0");
    params.set("pinX", String(store.pinOffsetX));
    params.set("pinY", String(store.pinOffsetY));
    params.set("shapeX", String(store.mapShapeOffsetX));
    params.set("shapeY", String(store.mapShapeOffsetY));
    params.set("textX", String(store.textOffsetX));
    params.set("textY", String(store.textOffsetY));
    params.set("textSpacing", String(store.textSpacing));
    params.set("shapeScale", String(store.mapShapeScale));

    const base = window.location.origin + route.path;
    return `${base}?${params.toString()}`;
  }

  async function copyShareUrl(): Promise<boolean> {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  function applyFromUrl() {
    const q = route.query;

    const lat = Number(q.lat);
    const lon = Number(q.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      store.setCoordinates(lat, lon);
    }

    const theme = String(q.theme ?? "").trim();
    if (theme && themeNames.includes(theme)) {
      store.setTheme(theme);
    }

    const city = String(q.city ?? "").trim();
    if (city.length >= 2) {
      store.displayCity = city;
    }

    const shape = String(q.shape ?? "").trim();
    if (shape && getMapShapeById(shape)) {
      store.setMapShape(shape);
    }

    const distance = Number(q.distance);
    if (Number.isFinite(distance)) {
      store.setDistance(distance);
    }

    const bearing = Number(q.bearing);
    if (Number.isFinite(bearing)) {
      store.setMapBearing(bearing);
    }

    const size = String(q.size ?? "").trim();
    if (size && ["18x24", "24x36", "30x40"].includes(size)) {
      store.setSize(size);
    }

    const pin = q.pin;
    if (pin === "1") store.showPin = true;
    else if (pin === "0") store.showPin = false;

    const pinX = Number(q.pinX);
    const pinY = Number(q.pinY);
    if (Number.isFinite(pinX) && Number.isFinite(pinY)) {
      store.setPinOffset(pinX, pinY);
    }

    const shapeX = Number(q.shapeX);
    const shapeY = Number(q.shapeY);
    if (Number.isFinite(shapeX) && Number.isFinite(shapeY)) {
      store.setMapShapeOffset(shapeX, shapeY);
    }

    const textX = Number(q.textX);
    const textY = Number(q.textY);
    if (Number.isFinite(textX) && Number.isFinite(textY)) {
      store.setTextOffset(textX, textY);
    }

    const textSpacing = Number(q.textSpacing);
    if (Number.isFinite(textSpacing)) {
      store.setTextSpacing(textSpacing);
    }

    const shapeScale = Number(q.shapeScale);
    if (Number.isFinite(shapeScale)) {
      store.setMapShapeScale(shapeScale);
    }
  }

  return {
    buildShareUrl,
    copyShareUrl,
    applyFromUrl,
  };
}

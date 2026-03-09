import { useMapStore } from "~/stores/map";
import { themeNames } from "~/lib/theme/themeRepository";
import { getMapShapeById } from "~/lib/shapes/mapShapes";
import { PRODUCT_TYPE_IDS, type ProductTypeId, type FrameColorId } from "~~/shared/productCatalog";

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
    params.set("pitch", String(store.mapPitch));
    params.set("size", store.selectedSizeId);
    params.set("productType", store.selectedProductType);
    if (store.needsFrameSelection) {
      params.set("frameColor", store.selectedFrameColor);
    }
    params.set("pin", store.showPin ? "1" : "0");
    params.set("pinX", String(store.pinOffsetX));
    params.set("pinY", String(store.pinOffsetY));
    params.set("shapeX", String(store.mapShapeOffsetX));
    params.set("shapeY", String(store.mapShapeOffsetY));
    params.set("textX", String(store.textOffsetX));
    params.set("textY", String(store.textOffsetY));
    params.set("textSpacing", String(store.textSpacing));
    params.set("shapeScale", String(store.mapShapeScale));

    // Additional Map Settings
    params.set("country", store.displayCountry || "");
    params.set("continent", store.displayContinent || "");
    params.set("aspect", store.selectedAspectRatioId);
    params.set("orient", store.selectedOrientation);
    params.set("font", store.fontFamily);
    params.set("sTitle", store.showTitle ? "1" : "0");
    params.set("sDiv", store.showDivider ? "1" : "0");
    params.set("sSub", store.showSubtitle ? "1" : "0");
    params.set("sCoord", store.showCoordinates ? "1" : "0");
    params.set("dispCoord", store.displayCoordinates || "");
    params.set("shapeBg", store.shapeBackgroundColor || "");
    params.set("textPreset", store.textPresetId);
    params.set("pinStyle", store.pinStyleId);
    params.set("pinColor", store.pinColor || "");
    params.set("pinSize", String(store.pinSize));
    params.set("incBldg", store.includeBuildings ? "1" : "0");
    params.set("incWater", store.includeWater ? "1" : "0");
    params.set("incParks", store.includeParks ? "1" : "0");

    // Typography Overrides
    if (store.titleFontFamily) params.set("tF", store.titleFontFamily);
    if (store.titleSizeScale !== null) params.set("tS", String(store.titleSizeScale));
    if (store.titleWeight !== null) params.set("tW", String(store.titleWeight));
    if (store.titleLetterSpacing !== null) params.set("tL", store.titleLetterSpacing);
    if (store.subtitleFontFamily) params.set("sF", store.subtitleFontFamily);
    if (store.subtitleSizeScale !== null) params.set("sS", String(store.subtitleSizeScale));
    if (store.subtitleWeight !== null) params.set("sW", String(store.subtitleWeight));
    if (store.subtitleLetterSpacing !== null) params.set("sL", store.subtitleLetterSpacing);
    if (store.coordsFontFamily) params.set("cF", store.coordsFontFamily);
    if (store.coordsSizeScale !== null) params.set("cS", String(store.coordsSizeScale));
    if (store.coordsWeight !== null) params.set("cW", String(store.coordsWeight));
    if (store.coordsLetterSpacing !== null) params.set("cL", store.coordsLetterSpacing);
    if (store.dividerLength !== null) params.set("dL", String(store.dividerLength));

    // Custom Map Colors
    if (Object.keys(store.customColors).length > 0) {
      params.set("cC", JSON.stringify(store.customColors));
    }

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

    const pitch = Number(q.pitch);
    if (Number.isFinite(pitch)) {
      store.setMapPitch(pitch);
    }

    const size = String(q.size ?? "").trim();
    if (size && ["18x24", "24x36", "30x40", "12x16"].includes(size)) {
      store.setSize(size);
    }

    const productType = String(q.productType ?? "").trim();
    if (productType && PRODUCT_TYPE_IDS.includes(productType as ProductTypeId)) {
      store.setProductType(productType as ProductTypeId);
    }

    const frameColor = String(q.frameColor ?? "").trim();
    if (frameColor && ["black", "white", "walnut"].includes(frameColor)) {
      store.setFrameColor(frameColor as FrameColorId);
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

    // Additional Map Settings Parsing
    const country = String(q.country ?? "").trim();
    if (country) store.displayCountry = country;

    const continent = String(q.continent ?? "").trim();
    if (continent) store.displayContinent = continent;

    const aspect = String(q.aspect ?? "").trim();
    if (aspect) store.selectedAspectRatioId = aspect;

    const orient = String(q.orient ?? "").trim();
    if (orient === "landscape" || orient === "portrait") store.selectedOrientation = orient;

    const font = String(q.font ?? "").trim();
    if (font) store.fontFamily = font;

    if (q.sTitle === "0") store.showTitle = false;
    else if (q.sTitle === "1") store.showTitle = true;

    if (q.sDiv === "0") store.showDivider = false;
    else if (q.sDiv === "1") store.showDivider = true;

    if (q.sSub === "0") store.showSubtitle = false;
    else if (q.sSub === "1") store.showSubtitle = true;

    if (q.sCoord === "0") store.showCoordinates = false;
    else if (q.sCoord === "1") store.showCoordinates = true;

    const dispCoord = String(q.dispCoord ?? "").trim();
    if (dispCoord) store.displayCoordinates = dispCoord;

    const shapeBg = String(q.shapeBg ?? "").trim();
    if (shapeBg) store.shapeBackgroundColor = shapeBg;

    const textPreset = String(q.textPreset ?? "").trim();
    if (textPreset) store.textPresetId = textPreset;

    const pinStyleStr = String(q.pinStyle ?? "").trim();
    if (pinStyleStr) store.pinStyleId = pinStyleStr;

    const pinColorStr = String(q.pinColor ?? "").trim();
    if (pinColorStr) store.pinColor = pinColorStr;

    const ps = Number(q.pinSize);
    if (Number.isFinite(ps)) store.pinSize = ps;

    if (q.incBldg === "0") store.includeBuildings = false;
    else if (q.incBldg === "1") store.includeBuildings = true;

    if (q.incWater === "0") store.includeWater = false;
    else if (q.incWater === "1") store.includeWater = true;

    if (q.incParks === "0") store.includeParks = false;
    else if (q.incParks === "1") store.includeParks = true;

    // Typography Overrides Parsing
    if (q.tF) store.titleFontFamily = String(q.tF);
    if (q.tS) store.titleSizeScale = Number(q.tS);
    if (q.tW) store.titleWeight = Number(q.tW);
    if (q.tL) store.titleLetterSpacing = String(q.tL);

    if (q.sF) store.subtitleFontFamily = String(q.sF);
    if (q.sS) store.subtitleSizeScale = Number(q.sS);
    if (q.sW) store.subtitleWeight = Number(q.sW);
    if (q.sL) store.subtitleLetterSpacing = String(q.sL);

    if (q.cF) store.coordsFontFamily = String(q.cF);
    if (q.cS) store.coordsSizeScale = Number(q.cS);
    if (q.cW) store.coordsWeight = Number(q.cW);
    if (q.cL) store.coordsLetterSpacing = String(q.cL);

    if (q.dL) store.dividerLength = Number(q.dL);

    // Custom Map Colors Parsing
    if (q.cC) {
      try {
        const parsedColors = JSON.parse(String(q.cC));
        if (typeof parsedColors === "object" && parsedColors !== null) {
          store.customColors = parsedColors;
        }
      } catch (e) {
        console.warn("Failed to parse custom colors from URL", e);
      }
    }
  }

  return {
    buildShareUrl,
    copyShareUrl,
    applyFromUrl,
  };
}

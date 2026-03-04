import type { Map as MapLibreMap } from "maplibre-gl";
import type { Ref } from "vue";
import { useMapStore } from "~/stores/map";
import { captureMapAsCanvas } from "~/lib/export/mapExporter";
import { compositeExport } from "~/lib/export/composite";
import { createPosterFilename } from "~/lib/export/filename";
import { ensureGoogleFont } from "~/lib/utils/fonts";

export function useExport(mapRef: Ref<MapLibreMap | null>) {
  const store = useMapStore();

  const exportMapPng = async (): Promise<{ blob: Blob; filename: string }> => {
    const map = mapRef.value;
    if (!map) {
      throw new Error("Map is not ready yet.");
    }

    store.setIsExporting(true);
    store.clearError();

    try {
      if (store.showAnyText && store.fontFamily.trim()) {
        await ensureGoogleFont(store.fontFamily.trim());
      }

      const size = store.selectedSize;
      const mapCanvas = await captureMapAsCanvas(
        map,
        size.targetWidthPx,
        size.targetHeightPx,
      );

      const finalCanvas = compositeExport(mapCanvas, {
        theme: store.effectiveTheme,
        center: { lat: store.latitude, lon: store.longitude },
        displayCity: store.displayCity || store.location,
        displayCountry: store.displayCountry,
        fontFamily: store.fontFamily,
        showTitle: store.showTitle,
        showDivider: store.showDivider,
        showSubtitle: store.showSubtitle,
        showCoordinates: store.showCoordinates,
        showPin: store.showPin,
        pinStyleId: store.pinStyleId,
        pinColor: store.effectivePinColor,
        pinSize: store.pinSize,
        mapShape: store.mapShape,
        mapShapeScale: store.mapShapeScale,
        mapShapeOffsetX: store.mapShapeOffsetX,
        mapShapeOffsetY: store.mapShapeOffsetY,
        shapeBackgroundColor: store.shapeBackgroundColor,
        textPresetId: store.textPresetId,
        displayCoordinates: store.displayCoordinates,
      });

      if (
        finalCanvas.width < size.targetWidthPx ||
        finalCanvas.height < size.targetHeightPx
      ) {
        throw new Error(
          `Export failed resolution validation. Expected ${size.targetWidthPx}x${size.targetHeightPx}px, got ${finalCanvas.width}x${finalCanvas.height}px.`,
        );
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob((value) => {
          if (!value) {
            reject(new Error("Failed to create PNG blob from canvas."));
            return;
          }
          resolve(value);
        }, "image/png");
      });

      const filename = createPosterFilename(
        store.displayCity || store.location,
        store.selectedThemeId,
        "png",
      );

      return { blob, filename };
    } finally {
      store.setIsExporting(false);
    }
  };

  return {
    exportMapPng,
  };
}

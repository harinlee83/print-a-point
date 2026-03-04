import type { Map as MapLibreMap } from "maplibre-gl";
import type { Ref } from "vue";
import { useMapStore } from "~/stores/map";
import { captureMapAsCanvas } from "~/lib/export/mapExporter";
import { compositeExport } from "~/lib/export/composite";
import { createPosterFilename } from "~/lib/export/filename";
import { ensureGoogleFont } from "~/lib/utils/fonts";

export function useExport(mapRef: Ref<MapLibreMap | null>) {
  const store = useMapStore();

  const exportMapPng = async (opts?: { showWatermark?: boolean }): Promise<{ blob: Blob; filename: string }> => {
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
        pinOffsetX: store.pinOffsetX,
        pinOffsetY: store.pinOffsetY,
        mapShape: store.mapShape,
        mapShapeScale: store.mapShapeScale,
        mapShapeOffsetX: store.mapShapeOffsetX,
        mapShapeOffsetY: store.mapShapeOffsetY,
        shapeBackgroundColor: store.shapeBackgroundColor,
        textPresetId: store.textPresetId,
        displayCoordinates: store.displayCoordinates,
        textSpacing: store.textSpacing,
        textOffsetX: store.textOffsetX,
        textOffsetY: store.textOffsetY,
        showWatermark: opts?.showWatermark,
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

  const exportMapSvg = async (opts?: { showWatermark?: boolean }): Promise<{ blob: Blob; filename: string }> => {
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
        pinOffsetX: store.pinOffsetX,
        pinOffsetY: store.pinOffsetY,
        mapShape: store.mapShape,
        mapShapeScale: store.mapShapeScale,
        mapShapeOffsetX: store.mapShapeOffsetX,
        mapShapeOffsetY: store.mapShapeOffsetY,
        shapeBackgroundColor: store.shapeBackgroundColor,
        textPresetId: store.textPresetId,
        displayCoordinates: store.displayCoordinates,
        textSpacing: store.textSpacing,
        textOffsetX: store.textOffsetX,
        textOffsetY: store.textOffsetY,
        showWatermark: opts?.showWatermark,
      });

      const dataUrl = finalCanvas.toDataURL("image/png");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${finalCanvas.width}" height="${finalCanvas.height}" viewBox="0 0 ${finalCanvas.width} ${finalCanvas.height}"><image width="${finalCanvas.width}" height="${finalCanvas.height}" href="${dataUrl}"/></svg>`;

      const blob = new Blob([svg], { type: "image/svg+xml" });
      const filename = createPosterFilename(
        store.displayCity || store.location,
        store.selectedThemeId,
        "svg",
      );

      return { blob, filename };
    } finally {
      store.setIsExporting(false);
    }
  };

  const downloadPng = async () => {
    try {
      const { blob, filename } = await exportMapPng({ showWatermark: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Export failed.");
    }
  };

  const downloadSvg = async () => {
    try {
      const { blob, filename } = await exportMapSvg({ showWatermark: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Export failed.");
    }
  };

  return {
    exportMapPng,
    exportMapSvg,
    downloadPng,
    downloadSvg,
  };
}

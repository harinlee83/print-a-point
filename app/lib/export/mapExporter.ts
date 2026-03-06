import maplibregl, {
  type Map as MaplibreMap,
  type StyleSpecification,
} from "maplibre-gl";
import { MAP_OVERZOOM_SCALE } from "~/lib/map/constants";

const EXPORT_MAP_TIMEOUT_MS = 20_000;

function waitForMapIdle(map: MaplibreMap): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("Timed out while waiting for map tiles to render."));
    }, EXPORT_MAP_TIMEOUT_MS);

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve();
    };

    if (map.loaded() && !map.isMoving()) {
      finish();
      return;
    }

    map.once("idle", finish);
  });
}

export async function captureMapAsCanvas(
  map: MaplibreMap,
  exportWidth: number,
  exportHeight: number,
  styleOverride?: StyleSpecification,
): Promise<HTMLCanvasElement> {
  await waitForMapIdle(map);

  const internalMapContainer = map.getContainer();
  const visibleContainer = internalMapContainer.parentElement;
  const visiblePreviewWidth =
    visibleContainer?.clientWidth ||
    Math.round(internalMapContainer.clientWidth / MAP_OVERZOOM_SCALE);
  const visiblePreviewHeight =
    visibleContainer?.clientHeight ||
    Math.round(internalMapContainer.clientHeight / MAP_OVERZOOM_SCALE);
  const previewWidth = Math.max(visiblePreviewWidth, 1);
  const previewHeight = Math.max(visiblePreviewHeight, 1);
  const center = map.getCenter();
  const zoom = map.getZoom();
  const pitch = map.getPitch();
  const bearing = map.getBearing();
  const style = styleOverride ?? (map.getStyle() as StyleSpecification);
  const widthScale = Math.max(exportWidth / previewWidth, 1);
  const heightScale = Math.max(exportHeight / previewHeight, 1);
  const basePixelRatio = Math.max(widthScale, heightScale, 1);

  const renderWidth = Math.max(1, Math.round(previewWidth * MAP_OVERZOOM_SCALE));
  const renderHeight = Math.max(1, Math.round(previewHeight * MAP_OVERZOOM_SCALE));
  const pixelRatio = Math.max(basePixelRatio / MAP_OVERZOOM_SCALE, 1);

  const offscreenContainer = document.createElement("div");
  offscreenContainer.style.position = "fixed";
  offscreenContainer.style.left = "-100000px";
  offscreenContainer.style.top = "0";
  offscreenContainer.style.width = `${renderWidth}px`;
  offscreenContainer.style.height = `${renderHeight}px`;
  offscreenContainer.style.pointerEvents = "none";
  offscreenContainer.style.opacity = "0";
  document.body.appendChild(offscreenContainer);

  const exportMap = new maplibregl.Map({
    container: offscreenContainer,
    style,
    center: [center.lng, center.lat],
    zoom,
    pitch,
    bearing,
    interactive: false,
    attributionControl: false,
    pixelRatio,
    canvasContextAttributes: { preserveDrawingBuffer: true },
  });

  try {
    await waitForMapIdle(exportMap);

    const glCanvas = exportMap.getCanvas();
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create 2D context for export canvas");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(glCanvas, 0, 0, exportWidth, exportHeight);
    return exportCanvas;
  } finally {
    exportMap.remove();
    offscreenContainer.remove();
  }
}

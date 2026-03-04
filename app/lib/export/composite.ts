import { applyFades } from "./layers";
import { drawPin } from "./pin";
import { drawPosterText } from "./typography";
import type { ResolvedTheme } from "~/lib/theme/types";
import { resolveMapShape } from "~/lib/shapes/mapShapes";

export interface CompositeOptions {
  theme: ResolvedTheme;
  center: { lat: number; lon: number };
  displayCity: string;
  displayCountry: string;
  fontFamily: string;
  showTitle: boolean;
  showDivider: boolean;
  showSubtitle: boolean;
  showCoordinates: boolean;
  showPin: boolean;
  pinStyleId: string;
  pinColor: string;
  pinSize: number;
  mapShape: string;
  shapeBackgroundColor: string;
  textPresetId: string;
  displayCoordinates: string;
}

export function compositeExport(
  mapCanvas: HTMLCanvasElement,
  options: CompositeOptions,
): HTMLCanvasElement {
  const width = mapCanvas.width;
  const height = mapCanvas.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas rendering is not available.");
  }

  const shape = resolveMapShape(options.mapShape);
  const isNone = options.mapShape === "none";

  if (!isNone) {
    // Fill background first for shaped maps
    const bgColor = options.shapeBackgroundColor || options.theme.ui.bg;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Clip map to shape
    ctx.save();
    const clipPath = shape.canvasClipPath(width, height);
    ctx.clip(clipPath);
    ctx.drawImage(mapCanvas, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(mapCanvas, 0, 0);
    applyFades(ctx, width, height, options.theme.ui.bg);
  }

  drawPin(ctx, {
    width,
    height,
    showPin: options.showPin,
    pinStyleId: options.pinStyleId,
    pinColor: options.pinColor,
    pinSize: options.pinSize,
  });

  drawPosterText(ctx, {
    width,
    height,
    theme: options.theme,
    center: options.center,
    city: options.displayCity,
    country: options.displayCountry,
    fontFamily: options.fontFamily,
    showTitle: options.showTitle,
    showDivider: options.showDivider,
    showSubtitle: options.showSubtitle,
    showCoordinates: options.showCoordinates,
    textPresetId: options.textPresetId,
    mapShapeId: options.mapShape,
    displayCoordinates: options.displayCoordinates,
  });

  return canvas;
}

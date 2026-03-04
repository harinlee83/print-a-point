import { applyFades } from "./layers";
import { drawPin } from "./pin";
import { drawPosterText } from "./typography";
import type { ResolvedTheme } from "~/lib/theme/types";
import { getScaledCanvasClipPath } from "~/lib/shapes/mapShapes";

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
  pinOffsetX?: number;
  pinOffsetY?: number;
  mapShape: string;
  mapShapeScale: number;
  mapShapeOffsetX: number;
  mapShapeOffsetY: number;
  shapeBackgroundColor: string;
  textPresetId: string;
  displayCoordinates: string;
  textSpacing?: number;
  textOffsetX?: number;
  textOffsetY?: number;
  showWatermark?: boolean;
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

  const isNone = options.mapShape === "none";

  if (!isNone) {
    // Fill background first for shaped maps
    const bgColor = options.shapeBackgroundColor || options.theme.ui.bg;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Clip map to scaled shape, apply offset
    const scale = options.mapShapeScale ?? 1;
    const dx = (width * (options.mapShapeOffsetX ?? 0)) / 100;
    const dy = (height * (options.mapShapeOffsetY ?? 0)) / 100;

    ctx.save();
    ctx.translate(dx, dy);
    const clipPath = getScaledCanvasClipPath(options.mapShape, width, height, scale);
    ctx.clip(clipPath);
    ctx.translate(-dx, -dy);
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
    pinOffsetX: options.pinOffsetX ?? 0,
    pinOffsetY: options.pinOffsetY ?? 0,
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
    textSpacing: options.textSpacing ?? 1,
    textOffsetX: options.textOffsetX ?? 0,
    textOffsetY: options.textOffsetY ?? 0,
  });

  if (options.showWatermark) {
    const fontSize = Math.round(width * 0.016);
    ctx.save();
    ctx.font = `${fontSize}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = options.theme.ui.text;
    ctx.globalAlpha = 0.4;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("Made with printapoint.com", width * 0.96, height * 0.97);
    ctx.restore();
  }

  return canvas;
}

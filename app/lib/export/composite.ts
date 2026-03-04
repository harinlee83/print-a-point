import { applyFades } from "./layers";
import { drawPin } from "./pin";
import { drawPosterText } from "./typography";
import type { ResolvedTheme } from "~/lib/theme/types";

export interface CompositeOptions {
  theme: ResolvedTheme;
  center: { lat: number; lon: number };
  displayCity: string;
  displayCountry: string;
  fontFamily: string;
  showPosterText: boolean;
  showPin: boolean;
  pinStyleId: string;
  pinColor: string;
  pinSize: number;
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

  ctx.drawImage(mapCanvas, 0, 0);
  applyFades(ctx, width, height, options.theme.ui.bg);
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
    showPosterText: options.showPosterText,
  });

  return canvas;
}

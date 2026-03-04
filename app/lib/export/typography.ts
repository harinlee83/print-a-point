import { formatCoordinates } from "~/lib/location/coordinates";
import {
  TEXT_DIMENSION_REFERENCE_PX,
  TEXT_CITY_Y_RATIO,
  TEXT_DIVIDER_Y_RATIO,
  TEXT_COUNTRY_Y_RATIO,
  TEXT_COORDS_Y_RATIO,
  TEXT_AREA_START_FIXED,
  CITY_TEXT_SHRINK_THRESHOLD,
  CITY_TEXT_SHRINK_THRESHOLD_LATIN,
  CITY_FONT_BASE_PX,
  CITY_FONT_MIN_PX,
  COUNTRY_FONT_BASE_PX,
  COORDS_FONT_BASE_PX,
  formatCityLabel,
  isLatinScript,
} from "./textLayout";
import type { ResolvedTheme } from "~/lib/theme/types";
import { resolveTextPreset } from "~/lib/text/textPresets";

export interface DrawTypographyInput {
  width: number;
  height: number;
  theme: ResolvedTheme;
  center: { lat: number; lon: number };
  city: string;
  country: string;
  fontFamily: string;
  showTitle: boolean;
  showDivider: boolean;
  showSubtitle: boolean;
  showCoordinates: boolean;
  textPresetId: string;
  mapShapeId: string;
  displayCoordinates: string;
}

export function drawPosterText(
  ctx: CanvasRenderingContext2D,
  input: DrawTypographyInput,
): void {
  const {
    width,
    height,
    theme,
    center,
    city,
    country,
    fontFamily,
    showTitle,
    showDivider,
    showSubtitle,
    showCoordinates,
    textPresetId,
    mapShapeId,
    displayCoordinates,
  } = input;

  if (!showTitle && !showDivider && !showSubtitle && !showCoordinates) {
    return;
  }

  const preset = resolveTextPreset(textPresetId);
  const isNone = mapShapeId === "none";

  const textColor = theme.ui.text || "#111111";
  const titleFontFamily = fontFamily
    ? `"${fontFamily}", "Space Grotesk", sans-serif`
    : '"Space Grotesk", sans-serif';
  const bodyFontFamily = fontFamily
    ? `"${fontFamily}", "IBM Plex Mono", monospace`
    : '"IBM Plex Mono", monospace';

  const dimScale = Math.max(
    0.45,
    Math.min(width, height) / TEXT_DIMENSION_REFERENCE_PX,
  );

  // Format city label
  const cityLabel = preset.useWideSpacing
    ? formatCityLabel(city)
    : preset.cityTransform === "uppercase"
      ? city.toUpperCase()
      : city;

  const cityLength = Math.max(cityLabel.length, 1);
  const threshold = isLatinScript(city)
    ? CITY_TEXT_SHRINK_THRESHOLD_LATIN
    : CITY_TEXT_SHRINK_THRESHOLD;
  let cityFontSize = CITY_FONT_BASE_PX * preset.citySizeScale * dimScale;
  if (cityLength > threshold) {
    cityFontSize = Math.max(
      CITY_FONT_MIN_PX * dimScale,
      cityFontSize * (threshold / cityLength),
    );
  }

  const countryFontSize = COUNTRY_FONT_BASE_PX * preset.countrySizeScale * dimScale;
  const coordinateFontSize = COORDS_FONT_BASE_PX * preset.coordsSizeScale * dimScale;

  // Compute Y positions. Use fixed start so text spacing stays consistent regardless of shape or shape size.
  function computeY(baseRatio: number): number {
    if (isNone) return height * baseRatio;
    const start = TEXT_AREA_START_FIXED;
    const available = 1 - start;
    const normalT = (baseRatio - TEXT_CITY_Y_RATIO) / (TEXT_COORDS_Y_RATIO - TEXT_CITY_Y_RATIO);
    const padTop = available * 0.15;
    const usable = available * 0.7;
    return height * (start + padTop + normalT * usable);
  }

  const cityY = computeY(TEXT_CITY_Y_RATIO);
  const lineY = computeY(TEXT_DIVIDER_Y_RATIO);
  const countryY = computeY(TEXT_COUNTRY_Y_RATIO);
  const coordinatesY = computeY(TEXT_COORDS_Y_RATIO);

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (showTitle) {
    ctx.font = `${preset.cityWeight} ${cityFontSize}px ${titleFontFamily}`;
    ctx.fillText(cityLabel, width * 0.5, cityY);
  }

  if (showDivider) {
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3 * dimScale;
    ctx.beginPath();
    ctx.moveTo(width * 0.4, lineY);
    ctx.lineTo(width * 0.6, lineY);
    ctx.stroke();
  }

  if (showSubtitle) {
    const countryText = preset.countryTransform === "uppercase"
      ? country.toUpperCase()
      : country;
    ctx.font = `${preset.countryWeight} ${countryFontSize}px ${titleFontFamily}`;
    ctx.fillText(countryText, width * 0.5, countryY);
  }

  if (showCoordinates) {
    ctx.globalAlpha = 0.75;
    ctx.font = `${preset.coordsWeight} ${coordinateFontSize}px ${bodyFontFamily}`;
    const coordsText = displayCoordinates.trim()
      ? displayCoordinates.trim()
      : formatCoordinates(center.lat, center.lon);
    ctx.fillText(coordsText, width * 0.5, coordinatesY);
    ctx.globalAlpha = 1;
  }
}

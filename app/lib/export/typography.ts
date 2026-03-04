import { formatCoordinates } from "~/lib/location/coordinates";
import {
  TEXT_DIMENSION_REFERENCE_PX,
  TEXT_CITY_Y_RATIO,
  TEXT_DIVIDER_Y_RATIO,
  TEXT_COUNTRY_Y_RATIO,
  TEXT_COORDS_Y_RATIO,
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
  textSpacing?: number;
  textOffsetX?: number;
  textOffsetY?: number;
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
    textSpacing = 1,
    textOffsetX = 0,
    textOffsetY = 0,
  } = input;

  if (!showTitle && !showDivider && !showSubtitle && !showCoordinates) {
    return;
  }

  const preset = resolveTextPreset(textPresetId);

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

  // Fixed positions for all shapes - text does not move when changing map shape.
  // textSpacing (0.5-1.5) scales the gaps between lines.
  function computeY(baseRatio: number): number {
    const cityBase = height * TEXT_CITY_Y_RATIO;
    const gap1 = height * (TEXT_DIVIDER_Y_RATIO - TEXT_CITY_Y_RATIO) * textSpacing;
    const gap2 = height * (TEXT_COUNTRY_Y_RATIO - TEXT_DIVIDER_Y_RATIO) * textSpacing;
    const gap3 = height * (TEXT_COORDS_Y_RATIO - TEXT_COUNTRY_Y_RATIO) * textSpacing;

    if (baseRatio <= TEXT_CITY_Y_RATIO) return cityBase;
    if (baseRatio <= TEXT_DIVIDER_Y_RATIO) return cityBase + gap1;
    if (baseRatio <= TEXT_COUNTRY_Y_RATIO) return cityBase + gap1 + gap2;
    return cityBase + gap1 + gap2 + gap3;
  }

  let cityY = computeY(TEXT_CITY_Y_RATIO);
  let lineY = computeY(TEXT_DIVIDER_Y_RATIO);
  let countryY = computeY(TEXT_COUNTRY_Y_RATIO);
  let coordinatesY = computeY(TEXT_COORDS_Y_RATIO);

  const offsetX = width * (textOffsetX / 100);
  const offsetY = height * (textOffsetY / 100);
  cityY += offsetY;
  lineY += offsetY;
  countryY += offsetY;
  coordinatesY += offsetY;
  const centerX = width * 0.5 + offsetX;

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (showTitle) {
    ctx.font = `${preset.cityWeight} ${cityFontSize}px ${titleFontFamily}`;
    ctx.fillText(cityLabel, centerX, cityY);
  }

  if (showDivider) {
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3 * dimScale;
    ctx.beginPath();
    ctx.moveTo(centerX - width * 0.1, lineY);
    ctx.lineTo(centerX + width * 0.1, lineY);
    ctx.stroke();
  }

  if (showSubtitle) {
    const countryText = preset.countryTransform === "uppercase"
      ? country.toUpperCase()
      : country;
    ctx.font = `${preset.countryWeight} ${countryFontSize}px ${titleFontFamily}`;
    ctx.fillText(countryText, centerX, countryY);
  }

  if (showCoordinates) {
    ctx.globalAlpha = 0.75;
    ctx.font = `${preset.coordsWeight} ${coordinateFontSize}px ${bodyFontFamily}`;
    const coordsText = displayCoordinates.trim()
      ? displayCoordinates.trim()
      : formatCoordinates(center.lat, center.lon);
    ctx.fillText(coordsText, centerX, coordinatesY);
    ctx.globalAlpha = 1;
  }
}

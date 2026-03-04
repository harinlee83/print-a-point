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

export interface DrawTypographyInput {
  width: number;
  height: number;
  theme: ResolvedTheme;
  center: { lat: number; lon: number };
  city: string;
  country: string;
  fontFamily: string;
  showPosterText: boolean;
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
    showPosterText,
  } = input;

  if (!showPosterText) {
    return;
  }

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

  const cityLabel = formatCityLabel(city);
  const cityLength = Math.max(cityLabel.length, 1);
  const threshold = isLatinScript(city)
    ? CITY_TEXT_SHRINK_THRESHOLD_LATIN
    : CITY_TEXT_SHRINK_THRESHOLD;
  let cityFontSize = CITY_FONT_BASE_PX * dimScale;
  if (cityLength > threshold) {
    cityFontSize = Math.max(
      CITY_FONT_MIN_PX * dimScale,
      cityFontSize * (threshold / cityLength),
    );
  }

  const countryFontSize = COUNTRY_FONT_BASE_PX * dimScale;
  const coordinateFontSize = COORDS_FONT_BASE_PX * dimScale;
  const cityY = height * TEXT_CITY_Y_RATIO;
  const lineY = height * TEXT_DIVIDER_Y_RATIO;
  const countryY = height * TEXT_COUNTRY_Y_RATIO;
  const coordinatesY = height * TEXT_COORDS_Y_RATIO;

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${cityFontSize}px ${titleFontFamily}`;
  ctx.fillText(cityLabel, width * 0.5, cityY);

  ctx.strokeStyle = textColor;
  ctx.lineWidth = 3 * dimScale;
  ctx.beginPath();
  ctx.moveTo(width * 0.4, lineY);
  ctx.lineTo(width * 0.6, lineY);
  ctx.stroke();

  ctx.font = `300 ${countryFontSize}px ${titleFontFamily}`;
  ctx.fillText(country.toUpperCase(), width * 0.5, countryY);

  ctx.globalAlpha = 0.75;
  ctx.font = `400 ${coordinateFontSize}px ${bodyFontFamily}`;
  ctx.fillText(
    formatCoordinates(center.lat, center.lon),
    width * 0.5,
    coordinatesY,
  );
  ctx.globalAlpha = 1;
}

export interface TextPreset {
  id: string;
  label: string;
  /** Google Font family name (empty = default Space Grotesk). */
  fontFamily: string;
  /** Font weight for the city (title) line. */
  cityWeight: number;
  /** Font weight for the country (subtitle) line. */
  countryWeight: number;
  /** Font weight for the coordinates line. */
  coordsWeight: number;
  /** CSS letter-spacing for city (e.g. "0.15em"). Empty = use wide-space formatting. */
  cityLetterSpacing: string;
  /** CSS letter-spacing for country. */
  countryLetterSpacing: string;
  /** CSS text-transform for city. */
  cityTransform: string;
  /** CSS text-transform for country. */
  countryTransform: string;
  /** Font size scale multiplier for city relative to base. */
  citySizeScale: number;
  /** Font size scale multiplier for country relative to base. */
  countrySizeScale: number;
  /** Font size scale multiplier for coordinates relative to base. */
  coordsSizeScale: number;
  /** Whether to use wide character-spaced formatting for city (classic style). */
  useWideSpacing: boolean;
  /** Whether divider is shown by default when this preset is selected. */
  showDividerDefault: boolean;
  /** Default divider character/style: "line" for the classic HR, or a text character. */
  dividerStyle: "line" | string;
}

export const DEFAULT_TEXT_PRESET_ID = "default";

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: "default",
    label: "Classic",
    fontFamily: "",
    cityWeight: 700,
    countryWeight: 300,
    coordsWeight: 400,
    cityLetterSpacing: "",
    countryLetterSpacing: "0.08em",
    cityTransform: "uppercase",
    countryTransform: "uppercase",
    citySizeScale: 1,
    countrySizeScale: 1,
    coordsSizeScale: 1,
    useWideSpacing: true,
    showDividerDefault: true,
    dividerStyle: "line",
  },
  {
    id: "elegant",
    label: "Elegant",
    fontFamily: "Dancing Script",
    cityWeight: 700,
    countryWeight: 400,
    coordsWeight: 400,
    cityLetterSpacing: "0.02em",
    countryLetterSpacing: "0.06em",
    cityTransform: "none",
    countryTransform: "uppercase",
    citySizeScale: 1.15,
    countrySizeScale: 0.9,
    coordsSizeScale: 0.9,
    useWideSpacing: false,
    showDividerDefault: false,
    dividerStyle: "line",
  },
  {
    id: "bold-serif",
    label: "Bold Serif",
    fontFamily: "Playfair Display",
    cityWeight: 700,
    countryWeight: 400,
    coordsWeight: 400,
    cityLetterSpacing: "0.04em",
    countryLetterSpacing: "0.12em",
    cityTransform: "uppercase",
    countryTransform: "uppercase",
    citySizeScale: 1.05,
    countrySizeScale: 1,
    coordsSizeScale: 1,
    useWideSpacing: false,
    showDividerDefault: true,
    dividerStyle: "line",
  },
  {
    id: "clean",
    label: "Modern",
    fontFamily: "Poppins",
    cityWeight: 600,
    countryWeight: 300,
    coordsWeight: 300,
    cityLetterSpacing: "0.08em",
    countryLetterSpacing: "0.1em",
    cityTransform: "uppercase",
    countryTransform: "uppercase",
    citySizeScale: 0.9,
    countrySizeScale: 1.1,
    coordsSizeScale: 1,
    useWideSpacing: false,
    showDividerDefault: true,
    dividerStyle: "line",
  },
];

export function getTextPresetById(id: string): TextPreset | undefined {
  return TEXT_PRESETS.find((p) => p.id === id);
}

export function resolveTextPreset(id: string): TextPreset {
  const found = TEXT_PRESETS.find((p) => p.id === id);
  if (!found) return TEXT_PRESETS[0]!;
  return found;
}

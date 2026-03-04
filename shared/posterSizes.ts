export type PosterSizeId = "18x24" | "24x36" | "30x40";

export interface PosterSize {
  id: PosterSizeId;
  label: string;
  widthInches: number;
  heightInches: number;
  widthCm: number;
  heightCm: number;
  targetWidthPx: number;
  targetHeightPx: number;
  defaultPriceCents: number;
}

export const POSTER_SIZES: PosterSize[] = [
  {
    id: "18x24",
    label: "18 x 24 in",
    widthInches: 18,
    heightInches: 24,
    widthCm: 45.7,
    heightCm: 61,
    targetWidthPx: 5400,
    targetHeightPx: 7200,
    defaultPriceCents: 8900,
  },
  {
    id: "24x36",
    label: "24 x 36 in",
    widthInches: 24,
    heightInches: 36,
    widthCm: 61,
    heightCm: 91.4,
    targetWidthPx: 7200,
    targetHeightPx: 10800,
    defaultPriceCents: 12900,
  },
  {
    id: "30x40",
    label: "30 x 40 in",
    widthInches: 30,
    heightInches: 40,
    widthCm: 76.2,
    heightCm: 101.6,
    targetWidthPx: 9000,
    targetHeightPx: 12000,
    defaultPriceCents: 16900,
  },
];

export const DEFAULT_POSTER_SIZE_ID: PosterSizeId = "18x24";

export function getPosterSizeById(sizeId: string): PosterSize | null {
  return POSTER_SIZES.find((size) => size.id === sizeId) ?? null;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

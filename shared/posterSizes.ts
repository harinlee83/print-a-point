export type PosterSizeId =
  | "5x7" | "6x6" | "8x8" | "8x10" | "8x12" | "9x12"
  | "10x10" | "10x20" | "11x14" | "12x12" | "12x16" | "12x18" | "12x24" | "12x36"
  | "14x14" | "16x16" | "16x20" | "16x24" | "16x32" | "16x48"
  | "18x18" | "18x24" | "18x26" | "20x20" | "20x24" | "20x28" | "20x30" | "20x40" | "20x60"
  | "A1" | "A2" | "24x24" | "24x30" | "24x32" | "24x36" | "24x48"
  | "26x26" | "26x40" | "28x28" | "28x40" | "30x30" | "30x40" | "30x60"
  | "32x32" | "32x48" | "36x36" | "37x37" | "40x55" | "40x60";

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
  printfulVariantId?: number;
}

function s(id: PosterSizeId, w: number, h: number, price: number = 539, variantId?: number): PosterSize {
  return {
    id,
    label: `${w} x ${h} in`,
    widthInches: w,
    heightInches: h,
    widthCm: Math.round(w * 2.54 * 10) / 10,
    heightCm: Math.round(h * 2.54 * 10) / 10,
    targetWidthPx: Math.round(w * 300),
    targetHeightPx: Math.round(h * 300),
    defaultPriceCents: price,
    printfulVariantId: variantId,
  };
}

export const POSTER_SIZES: PosterSize[] = [
  // 1:1
  s("6x6", 6, 6), s("8x8", 8, 8), s("10x10", 10, 10, 789, 6239), s("12x12", 12, 12, 889, 4464),
  s("14x14", 14, 14, 989, 6240), s("16x16", 16, 16, 1164, 4465), s("18x18", 18, 18, 1239, 6242), s("20x20", 20, 20),
  s("24x24", 24, 24), s("26x26", 26, 26), s("28x28", 28, 28), s("30x30", 30, 30),
  s("32x32", 32, 32), s("36x36", 36, 36), s("37x37", 37, 37),

  // 4:5
  s("8x10", 8, 10, 689, 4463), s("16x20", 16, 20, 1189, 3877), s("24x30", 24, 30),

  // 3:4
  s("9x12", 9, 12), s("12x16", 12, 16, 1089, 1349), s("18x24", 18, 24, 1289, 1), s("24x32", 24, 32), s("30x40", 30, 40),

  // 2:3
  s("8x12", 8, 12), s("12x18", 12, 18, 1139, 3876), s("16x24", 16, 24), s("20x30", 20, 30, 1289, 16365), s("24x36", 24, 36, 1789, 2), s("32x48", 32, 48), s("40x60", 40, 60),

  // 5:7
  s("5x7", 5, 7, 539, 16364), s("20x28", 20, 28),

  // 11:14
  s("11x14", 11, 14, 964, 14125),

  // 1:2
  s("10x20", 10, 20), s("12x24", 12, 24), s("16x32", 16, 32), s("20x40", 20, 40), s("24x48", 24, 48), s("30x60", 30, 60),

  // 1:3
  s("12x36", 12, 36), s("16x48", 16, 48), s("20x60", 20, 60),

  // 9:13
  s("18x26", 18, 26),

  // 13:20
  s("26x40", 26, 40),

  // 7:10
  s("28x40", 28, 40),

  // A sizes
  s("A1", 23.4, 33.1, 1689, 19527),
  s("A2", 16.5, 23.4, 1264, 19528),

  // 8:11
  s("40x55", 40, 55),
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

/**
 * Aspect ratio definitions and print size catalog.
 *
 * Each ratio groups the physical print sizes that share that proportion.
 * Pixel targets assume 300 DPI for print-quality output.
 */

export interface PrintSize {
  widthInches: number;
  heightInches: number;
  widthCm: number;
  heightCm: number;
  /** Print-quality pixel width at 300 DPI */
  targetWidthPx: number;
  /** Print-quality pixel height at 300 DPI */
  targetHeightPx: number;
  label: string;
}

export interface AspectRatio {
  id: string;
  label: string;
  /** Width component of the ratio (e.g. 2 for 2:3) */
  w: number;
  /** Height component of the ratio (e.g. 3 for 2:3) */
  h: number;
  sizes: PrintSize[];
}

function s(w: number, h: number): PrintSize {
  return {
    widthInches: w,
    heightInches: h,
    widthCm: Math.round(w * 2.54 * 10) / 10,
    heightCm: Math.round(h * 2.54 * 10) / 10,
    targetWidthPx: w * 300,
    targetHeightPx: h * 300,
    label: `${w} x ${h} in`,
  };
}

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    id: "1:3",
    label: "1 : 3",
    w: 1,
    h: 3,
    sizes: [s(12, 36), s(16, 48), s(20, 60)],
  },
  {
    id: "1:2",
    label: "1 : 2",
    w: 1,
    h: 2,
    sizes: [s(10, 20), s(12, 24), s(16, 32), s(20, 40), s(24, 48), s(30, 60)],
  },
  {
    id: "13:20",
    label: "13 : 20",
    w: 13,
    h: 20,
    sizes: [s(26, 40)],
  },
  {
    id: "2:3",
    label: "2 : 3",
    w: 2,
    h: 3,
    sizes: [s(8, 12), s(12, 18), s(16, 24), s(20, 30), s(24, 36), s(32, 48), s(40, 60)],
  },
  {
    id: "9:13",
    label: "9 : 13",
    w: 9,
    h: 13,
    sizes: [s(18, 26)],
  },
  {
    id: "7:10",
    label: "7 : 10",
    w: 7,
    h: 10,
    sizes: [s(28, 40)],
  },
  {
    id: "A1",
    label: "A1",
    w: 23.4,
    h: 33.1,
    sizes: [s(23.4, 33.1)],
  },
  {
    id: "A2",
    label: "A2",
    w: 16.5,
    h: 23.4,
    sizes: [s(16.5, 23.4)],
  },
  {
    id: "5:7",
    label: "5 : 7",
    w: 5,
    h: 7,
    sizes: [s(5, 7), s(20, 28)],
  },
  {
    id: "8:11",
    label: "8 : 11",
    w: 8,
    h: 11,
    sizes: [s(40, 55)],
  },
  {
    id: "3:4",
    label: "3 : 4",
    w: 3,
    h: 4,
    sizes: [s(9, 12), s(12, 16), s(18, 24), s(24, 32), s(30, 40)],
  },
  {
    id: "11:14",
    label: "11 : 14",
    w: 11,
    h: 14,
    sizes: [s(11, 14)],
  },
  {
    id: "4:5",
    label: "4 : 5",
    w: 4,
    h: 5,
    sizes: [s(8, 10), s(16, 20), s(24, 30)],
  },
  {
    id: "5:6",
    label: "5 : 6",
    w: 5,
    h: 6,
    sizes: [s(20, 24)],
  },
  {
    id: "1:1",
    label: "1 : 1",
    w: 1,
    h: 1,
    sizes: [
      s(6, 6),
      s(8, 8),
      s(10, 10),
      s(12, 12),
      s(14, 14),
      s(16, 16),
      s(18, 18),
      s(20, 20),
      s(24, 24),
      s(26, 26),
      s(28, 28),
      s(30, 30),
      s(32, 32),
      s(36, 36),
      s(37, 37),
    ],
  },
];

export const DEFAULT_ASPECT_RATIO_ID = "2:3";

export const ASPECT_RATIO_IDS: string[] = ASPECT_RATIOS.map((r) => r.id);

export function getAspectRatioById(id: string): AspectRatio | undefined {
  return ASPECT_RATIOS.find((r) => r.id === id);
}

export function getSizesForRatio(ratioId: string): PrintSize[] {
  return getAspectRatioById(ratioId)?.sizes ?? [];
}

export function findRatioForSize(
  widthInches: number,
  heightInches: number,
): AspectRatio | undefined {
  return ASPECT_RATIOS.find((r) =>
    r.sizes.some(
      (size) =>
        size.widthInches === widthInches && size.heightInches === heightInches,
    ),
  );
}

/** PNG download resolution presets */
export interface PngResolutionPreset {
  id: string;
  label: string;
  /** Width in pixels; height derived from aspect ratio */
  widthPx: number;
}

export const PNG_RESOLUTION_PRESETS: PngResolutionPreset[] = [
  { id: "standard", label: "Standard (2048px)", widthPx: 2048 },
  { id: "high", label: "High (4096px)", widthPx: 4096 },
  { id: "ultra", label: "Ultra (8192px)", widthPx: 8192 },
];

export const DEFAULT_PNG_RESOLUTION_ID = "standard";

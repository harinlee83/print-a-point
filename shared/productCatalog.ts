export type ProductTypeId = "poster" | "framed-poster" | "canvas" | "framed-canvas";
export type FrameColorId = "black" | "white" | "oak";

export interface ProductVariant {
  sizeLabel: string;
  widthInches: number;
  heightInches: number;
  widthCm: number;
  heightCm: number;
  targetWidthPx: number;
  targetHeightPx: number;
  defaultPriceCents: number;
  envVarKey: string;
  printfulVariantId?: number;
}

export interface FrameOption {
  id: FrameColorId;
  label: string;
  colorHex: string;
}

export interface ProductType {
  id: ProductTypeId;
  label: string;
  shortLabel: string;
  description: string;
  features?: string[];
  printfulProductId: number | null;
  hasFrameOptions: boolean;
  frameOptions: FrameOption[];
  variants: ProductVariant[];
}

const FRAME_OPTIONS: FrameOption[] = [
  { id: "black", label: "Black", colorHex: "#1a1a1a" },
  { id: "white", label: "White", colorHex: "#f5f5f0" },
  { id: "oak", label: "Red Oak", colorHex: "#D4A489" },
];

import { POSTER_SIZES, type PosterSize } from "./posterSizes";

function deriveEnvKey(type: string, size: PosterSize, color?: string): string {
  const sizePart = size.id.replace(".", "_");
  const typePart = type.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const colorPart = color ? `_${color.charAt(0).toUpperCase() + color.slice(1)}` : "";
  return `printfulVariant${typePart}${sizePart}${colorPart}`;
}

function posterVariants(): ProductVariant[] {
  return POSTER_SIZES.map((s) => ({
    ...s,
    sizeLabel: s.label,
    envVarKey: deriveEnvKey("poster", s),
    printfulVariantId: s.printfulVariantId,
  }));
}

function framedPosterVariants(): ProductVariant[] {
  const variants: ProductVariant[] = [];
  FRAME_OPTIONS.forEach((color) => {
    POSTER_SIZES.forEach((s) => {
      // Approximate framed price (base + $30 for frame)
      const framedPrice = s.defaultPriceCents + 3000;
      variants.push({
        sizeLabel: s.label,
        widthInches: s.widthInches,
        heightInches: s.heightInches,
        widthCm: s.widthCm,
        heightCm: s.heightCm,
        targetWidthPx: s.targetWidthPx,
        targetHeightPx: s.targetHeightPx,
        defaultPriceCents: framedPrice,
        envVarKey: deriveEnvKey("framed-poster", s, color.id),
        // Variant IDs for framed posters are complex, 
        // normally we'd fetch these or have a full mapping.
      });
    });
  });
  return variants;
}

function canvasVariants(): ProductVariant[] {
  return POSTER_SIZES.map((s) => ({
    sizeLabel: s.label,
    widthInches: s.widthInches,
    heightInches: s.heightInches,
    widthCm: s.widthCm,
    heightCm: s.heightCm,
    targetWidthPx: s.targetWidthPx,
    targetHeightPx: s.targetHeightPx,
    // Canvas price (base + $40)
    defaultPriceCents: s.defaultPriceCents + 4000,
    envVarKey: deriveEnvKey("canvas", s),
    // Map panoramic canvases specifically as they are confirmed in products.json
    printfulVariantId: s.id === "12x36" ? 19301 : s.id === "16x48" ? 19305 : s.id === "20x60" ? 19313 : undefined,
  }));
}

function framedCanvasVariants(): ProductVariant[] {
  const variants: ProductVariant[] = [];
  FRAME_OPTIONS.forEach((color) => {
    POSTER_SIZES.forEach((s) => {
      // Framed canvas price (base + $60)
      const framedCanvasPrice = s.defaultPriceCents + 6000;
      variants.push({
        sizeLabel: s.label,
        widthInches: s.widthInches,
        heightInches: s.heightInches,
        widthCm: s.widthCm,
        heightCm: s.heightCm,
        targetWidthPx: s.targetWidthPx,
        targetHeightPx: s.targetHeightPx,
        defaultPriceCents: framedCanvasPrice,
        envVarKey: deriveEnvKey("framed-canvas", s, color.id),
      });
    });
  });
  return variants;
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: "poster",
    label: "Enhanced Matte Paper Poster",
    shortLabel: "Poster",
    description: "Bring out the best in your artwork with these museum-quality posters made of thick matte paper. Each poster is printed with multicolor, water-based inkjet printing technique that yields brilliant prints to brighten up any room.",
    features: [
      "Paper thickness: 10.3 mil (0.26 mm)",
      "Paper weight: 189 g/m²",
      "Opacity: 94%",
      "ISO brightness: 104%",
      "Paper is sourced from Japan",
    ],
    printfulProductId: 1,
    hasFrameOptions: false,
    frameOptions: [],
    variants: posterVariants(),
  },
  {
    id: "framed-poster",
    label: "Enhanced Matte Paper Framed Poster",
    shortLabel: "Framed Poster",
    description: "A framed, enhanced poster whose museum-quality matte paper will give your design a polished and sophisticated look. What's more, it's already framed and ready to adorn any home or office. Each poster is printed with multicolor, water-based inkjet printing technique that gives you the best possible outcome.",
    features: [
      "Ayous wood .75″ (1.9 cm) thick frame from renewable forests",
      "Paper thickness: 10.3 mil (0.26 mm)",
      "Paper weight: 189 g/m²",
      "Lightweight",
      "Acrylite front protector",
      "Hanging hardware included",
    ],
    printfulProductId: 2,
    hasFrameOptions: true,
    frameOptions: FRAME_OPTIONS,
    variants: framedPosterVariants(),
  },
  {
    id: "canvas",
    label: "Stretched Canvas",
    shortLabel: "Canvas",
    description: "Gallery-wrapped stretched canvas with solid support frame.",
    features: [
      "Acid-free, PH-neutral, poly-cotton base",
      "20.5 mil (0.5 mm) thick poly-cotton blend canvas",
      "Canvas fabric weight: 13.9 oz/yd2(470 g/m²)",
      "Hand-glued solid wood stretcher bars",
    ],
    printfulProductId: 3,
    hasFrameOptions: false,
    frameOptions: [],
    variants: canvasVariants(),
  },
  {
    id: "framed-canvas",
    label: "Framed Canvas",
    shortLabel: "Framed Canvas",
    description: "Stretched canvas in a floating frame. Available in black, white, or walnut.",
    features: [
      "Pine tree frame",
      "Frame thickness: 1.25″ (3.18 cm)",
      "Canvas fabric weight: 13.9 oz/yd2(470 g/m²)",
      "Open back with rubber pads and hanging hardware",
    ],
    printfulProductId: 614,
    hasFrameOptions: true,
    frameOptions: FRAME_OPTIONS,
    variants: framedCanvasVariants(),
  },
];

export const PRODUCT_TYPE_IDS: ProductTypeId[] = PRODUCT_TYPES.map((p) => p.id);

export function getProductTypeById(id: ProductTypeId): ProductType {
  const found = PRODUCT_TYPES.find((p) => p.id === id);
  if (!found) return PRODUCT_TYPES[0]!;
  return found;
}

export function getAvailableSizes(
  productTypeId: ProductTypeId,
  frameColorId?: FrameColorId,
): ProductVariant[] {
  const product = getProductTypeById(productTypeId);
  if (!product.hasFrameOptions) {
    return product.variants;
  }
  const color = frameColorId ?? product.frameOptions[0]?.id ?? "black";
  const colorSuffix = color.charAt(0).toUpperCase() + color.slice(1);
  return product.variants.filter((v) => v.envVarKey.endsWith(`_${colorSuffix}`));
}

export function getVariantEnvKey(
  productTypeId: ProductTypeId,
  sizeLabel: string,
  frameColorId?: FrameColorId,
): string | null {
  const product = getProductTypeById(productTypeId);
  let variants = product.variants;
  if (product.hasFrameOptions && frameColorId) {
    const colorSuffix = frameColorId.charAt(0).toUpperCase() + frameColorId.slice(1);
    variants = variants.filter((v) => v.envVarKey.endsWith(`_${colorSuffix}`));
  }
  const variant = variants.find((v) => v.sizeLabel === sizeLabel);
  return variant?.envVarKey ?? null;
}

export function getStartingPrice(productTypeId: ProductTypeId): number {
  const sizes = getAvailableSizes(productTypeId);
  if (sizes.length === 0) return 0;
  return Math.min(...sizes.map((s) => s.defaultPriceCents));
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export interface RecommendedVariant extends ProductVariant {
  ratioDifference: number;
}

/**
 * Filters variants to strictly match the targeted design aspect ratio.
 */
export function getRecommendedVariants(
  productTypeId: ProductTypeId,
  designRatio: number, // width / height
  frameColorId?: FrameColorId,
): RecommendedVariant[] {
  const allVariants = getAvailableSizes(productTypeId, frameColorId);

  return allVariants
    .map((v) => {
      const ratio1 = v.widthInches / v.heightInches;
      const ratio2 = v.heightInches / v.widthInches;
      
      // Calculate diff against both portrait and landscape physical sizes
      const diff1 = Math.abs(ratio1 - designRatio);
      const diff2 = Math.abs(ratio2 - designRatio);
      const diff = Math.min(diff1, diff2);

      return {
        ...v,
        ratioDifference: diff,
      };
    })
    .filter((v) => v.ratioDifference < 0.01) // Strict exact match only
    .sort((a, b) => a.targetWidthPx - b.targetWidthPx);
}

/**
 * Checks if a given design aspect ratio has at least one exact physical setup match
 */
export function hasAnyExactSizeMatch(
  productTypeId: ProductTypeId,
  designRatio: number,
  frameColorId?: FrameColorId,
): boolean {
  return getRecommendedVariants(productTypeId, designRatio, frameColorId).length > 0;
}

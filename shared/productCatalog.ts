export type ProductTypeId = "poster" | "framed-poster" | "canvas" | "framed-canvas";
export type FrameColorId = "black" | "white" | "walnut";

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
  printfulProductId: number | null;
  hasFrameOptions: boolean;
  frameOptions: FrameOption[];
  variants: ProductVariant[];
}

const FRAME_OPTIONS: FrameOption[] = [
  { id: "black", label: "Black", colorHex: "#1a1a1a" },
  { id: "white", label: "White", colorHex: "#f5f5f0" },
  { id: "walnut", label: "Walnut", colorHex: "#5c3a1e" },
];

import { POSTER_SIZES, type PosterSize } from "./posterSizes";

function deriveEnvKey(type: string, size: PosterSize, color?: string): string {
  const sizePart = size.id.replace(".", "_");
  const typePart = type.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const colorPart = color ? color.charAt(0).toUpperCase() + color.slice(1) : "";
  return `printfulVariant${typePart}${sizePart}${colorPart}`;
}

function posterVariants(): ProductVariant[] {
  return POSTER_SIZES.map((s) => ({
    ...s,
    sizeLabel: s.label,
    envVarKey: deriveEnvKey("poster", s),
  }));
}

function framedPosterVariants(): ProductVariant[] {
  const variants: ProductVariant[] = [];
  for (const s of POSTER_SIZES) {
    for (const frame of FRAME_OPTIONS) {
      variants.push({
        ...s,
        sizeLabel: s.label,
        defaultPriceCents: s.defaultPriceCents + 4000,
        envVarKey: deriveEnvKey("framed-poster", s, frame.id),
      });
    }
  }
  return variants;
}

function canvasVariants(): ProductVariant[] {
  return POSTER_SIZES.map((s) => ({
    ...s,
    sizeLabel: s.label,
    defaultPriceCents: s.defaultPriceCents + 3000,
    envVarKey: deriveEnvKey("canvas", s),
  }));
}

function framedCanvasVariants(): ProductVariant[] {
  const variants: ProductVariant[] = [];
  for (const s of POSTER_SIZES) {
    for (const frame of FRAME_OPTIONS) {
      variants.push({
        ...s,
        sizeLabel: s.label,
        defaultPriceCents: s.defaultPriceCents + 7000,
        envVarKey: deriveEnvKey("framed-canvas", s, frame.id),
      });
    }
  }
  return variants;
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: "poster",
    label: "Enhanced Matte Paper Poster",
    shortLabel: "Poster",
    description: "Museum-quality matte print on enhanced paper.",
    printfulProductId: 1,
    hasFrameOptions: false,
    frameOptions: [],
    variants: posterVariants(),
  },
  {
    id: "framed-poster",
    label: "Enhanced Matte Paper Framed Poster",
    shortLabel: "Framed Poster",
    description: "Matte poster in a sleek frame. Available in black, white, or walnut.",
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
  return product.variants.filter((v) => v.envVarKey.endsWith(`_${color}`));
}

export function getVariantEnvKey(
  productTypeId: ProductTypeId,
  sizeLabel: string,
  frameColorId?: FrameColorId,
): string | null {
  const product = getProductTypeById(productTypeId);
  let variants = product.variants;
  if (product.hasFrameOptions && frameColorId) {
    variants = variants.filter((v) => v.envVarKey.endsWith(`_${frameColorId}`));
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

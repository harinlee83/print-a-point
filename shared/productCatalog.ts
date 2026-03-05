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

const POSTER_SIZES: ProductVariant[] = [
  {
    sizeLabel: "18 x 24 in",
    widthInches: 18,
    heightInches: 24,
    widthCm: 45.7,
    heightCm: 61,
    targetWidthPx: 5400,
    targetHeightPx: 7200,
    defaultPriceCents: 8900,
    envVarKey: "printfulVariantPoster18x24",
  },
  {
    sizeLabel: "24 x 36 in",
    widthInches: 24,
    heightInches: 36,
    widthCm: 61,
    heightCm: 91.4,
    targetWidthPx: 7200,
    targetHeightPx: 10800,
    defaultPriceCents: 12900,
    envVarKey: "printfulVariantPoster24x36",
  },
  {
    sizeLabel: "30 x 40 in",
    widthInches: 30,
    heightInches: 40,
    widthCm: 76.2,
    heightCm: 101.6,
    targetWidthPx: 9000,
    targetHeightPx: 12000,
    defaultPriceCents: 16900,
    envVarKey: "printfulVariantPoster30x40",
  },
];

function framedPosterVariants(): ProductVariant[] {
  const sizes = [
    { sizeLabel: "18 x 24 in", w: 18, h: 24, wcm: 45.7, hcm: 61, wpx: 5400, hpx: 7200, price: 14900 },
    { sizeLabel: "24 x 36 in", w: 24, h: 36, wcm: 61, hcm: 91.4, wpx: 7200, hpx: 10800, price: 19900 },
    { sizeLabel: "30 x 40 in", w: 30, h: 40, wcm: 76.2, hcm: 101.6, wpx: 9000, hpx: 12000, price: 24900 },
  ];
  const variants: ProductVariant[] = [];
  for (const s of sizes) {
    for (const frame of FRAME_OPTIONS) {
      const sizeKey = s.sizeLabel.replace(/\s/g, "").replace("x", "x");
      variants.push({
        sizeLabel: s.sizeLabel,
        widthInches: s.w,
        heightInches: s.h,
        widthCm: s.wcm,
        heightCm: s.hcm,
        targetWidthPx: s.wpx,
        targetHeightPx: s.hpx,
        defaultPriceCents: s.price,
        envVarKey: `printfulVariantFramedPoster${sizeKey}_${frame.id}`,
      });
    }
  }
  return variants;
}

function canvasVariants(): ProductVariant[] {
  return [
    {
      sizeLabel: "12 x 16 in",
      widthInches: 12,
      heightInches: 16,
      widthCm: 30.5,
      heightCm: 40.6,
      targetWidthPx: 3600,
      targetHeightPx: 4800,
      defaultPriceCents: 7900,
      envVarKey: "printfulVariantCanvas12x16",
    },
    {
      sizeLabel: "18 x 24 in",
      widthInches: 18,
      heightInches: 24,
      widthCm: 45.7,
      heightCm: 61,
      targetWidthPx: 5400,
      targetHeightPx: 7200,
      defaultPriceCents: 11900,
      envVarKey: "printfulVariantCanvas18x24",
    },
    {
      sizeLabel: "24 x 36 in",
      widthInches: 24,
      heightInches: 36,
      widthCm: 61,
      heightCm: 91.4,
      targetWidthPx: 7200,
      targetHeightPx: 10800,
      defaultPriceCents: 16900,
      envVarKey: "printfulVariantCanvas24x36",
    },
  ];
}

function framedCanvasVariants(): ProductVariant[] {
  const sizes = [
    { sizeLabel: "12 x 16 in", w: 12, h: 16, wcm: 30.5, hcm: 40.6, wpx: 3600, hpx: 4800, price: 12900 },
    { sizeLabel: "18 x 24 in", w: 18, h: 24, wcm: 45.7, hcm: 61, wpx: 5400, hpx: 7200, price: 17900 },
    { sizeLabel: "24 x 36 in", w: 24, h: 36, wcm: 61, hcm: 91.4, wpx: 7200, hpx: 10800, price: 22900 },
  ];
  const variants: ProductVariant[] = [];
  for (const s of sizes) {
    for (const frame of FRAME_OPTIONS) {
      const sizeKey = s.sizeLabel.replace(/\s/g, "").replace("x", "x");
      variants.push({
        sizeLabel: s.sizeLabel,
        widthInches: s.w,
        heightInches: s.h,
        widthCm: s.wcm,
        heightCm: s.hcm,
        targetWidthPx: s.wpx,
        targetHeightPx: s.hpx,
        defaultPriceCents: s.price,
        envVarKey: `printfulVariantFramedCanvas${sizeKey}_${frame.id}`,
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
    variants: POSTER_SIZES,
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
    printfulProductId: null,
    hasFrameOptions: false,
    frameOptions: [],
    variants: canvasVariants(),
  },
  {
    id: "framed-canvas",
    label: "Framed Canvas",
    shortLabel: "Framed Canvas",
    description: "Stretched canvas in a floating frame. Available in black, white, or walnut.",
    printfulProductId: null,
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

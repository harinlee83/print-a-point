import { getServerPosterSizes, getServerProductCatalog } from "~~/server/utils/sizeCatalog";

export default defineEventHandler((event) => {
  const catalog = getServerProductCatalog(event);

  const products = catalog.map((product) => ({
    id: product.id,
    label: product.label,
    shortLabel: product.shortLabel,
    description: product.description,
    hasFrameOptions: product.hasFrameOptions,
    frameOptions: product.frameOptions,
    variants: product.variants.map((v) => ({
      sizeLabel: v.sizeLabel,
      widthInches: v.widthInches,
      heightInches: v.heightInches,
      widthCm: v.widthCm,
      heightCm: v.heightCm,
      targetWidthPx: v.targetWidthPx,
      targetHeightPx: v.targetHeightPx,
      priceCents: v.priceCents,
      available: Boolean(v.variantId),
    })),
  }));

  // Backward-compatible sizes field
  const sizes = getServerPosterSizes(event).map((size) => ({
    id: size.id,
    label: size.label,
    widthInches: size.widthInches,
    heightInches: size.heightInches,
    widthCm: size.widthCm,
    heightCm: size.heightCm,
    targetWidthPx: size.targetWidthPx,
    targetHeightPx: size.targetHeightPx,
    priceCents: size.priceCents,
    available: Boolean(size.variantId),
  }));

  return {
    products,
    sizes,
  };
});

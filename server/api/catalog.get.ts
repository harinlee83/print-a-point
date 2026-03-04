import { getServerPosterSizes } from "~~/server/utils/sizeCatalog";

export default defineEventHandler((event) => {
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
    sizes,
  };
});

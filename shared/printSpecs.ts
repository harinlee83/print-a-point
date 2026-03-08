import type { ProductTypeId } from "./productCatalog";

/** Printful standard gallery wrap depth for stretched canvases (inches) */
export const CANVAS_WRAP_INCHES = 1.5;

export interface PrintSpec {
  hasWrap: boolean;
  wrapInches: number;
  hasFrame: boolean;
}

const SPECS: Record<ProductTypeId, PrintSpec> = {
  poster: { hasWrap: false, wrapInches: 0, hasFrame: false },
  "framed-poster": { hasWrap: false, wrapInches: 0, hasFrame: true },
  canvas: { hasWrap: true, wrapInches: CANVAS_WRAP_INCHES, hasFrame: false },
  "framed-canvas": {
    hasWrap: true,
    wrapInches: CANVAS_WRAP_INCHES,
    hasFrame: true,
  },
};

export function getPrintSpec(productTypeId: ProductTypeId): PrintSpec {
  return SPECS[productTypeId] ?? SPECS.poster;
}

/**
 * Returns the wrap zone as a percentage of the total printed area for a
 * given face dimension. This approximates how much of each image edge
 * will fold around the canvas stretcher bars.
 *
 * For an 18" face with 1.5" wrap: total = 21", wrap% = 1.5/21 = ~7.1%
 */
export function getWrapPercent(
  wrapInches: number,
  faceInches: number,
): number {
  if (faceInches <= 0 || wrapInches <= 0) return 0;
  return (wrapInches / (faceInches + 2 * wrapInches)) * 100;
}

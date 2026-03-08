import type { H3Event } from "h3";
import { getPosterSizeById, POSTER_SIZES, type PosterSizeId } from "~~/shared/posterSizes";
import {
  PRODUCT_TYPES,
  getProductTypeById,
  getAvailableSizes,
  type ProductTypeId,
  type FrameColorId,
  type ProductVariant,
  type ProductType,
} from "~~/shared/productCatalog";

export interface ServerPosterSize {
  id: PosterSizeId;
  label: string;
  widthInches: number;
  heightInches: number;
  widthCm: number;
  heightCm: number;
  targetWidthPx: number;
  targetHeightPx: number;
  priceCents: number;
  variantId: number | null;
}

export interface ServerProductVariant extends ProductVariant {
  priceCents: number;
  variantId: number | null;
}

export interface ServerProductType {
  id: ProductTypeId;
  label: string;
  shortLabel: string;
  description: string;
  hasFrameOptions: boolean;
  frameOptions: ProductType["frameOptions"];
  variants: ServerProductVariant[];
}

import productsData from "~~/products.json";
import canvasPrices from "~~/listing_prices/canvas.json";
import posterPrices from "~~/listing_prices/poster.json";
import framedCanvasPrices from "~~/listing_prices/framed_canvas.json";
import framedPosterPrices from "~~/listing_prices/framed_poster.json";

function findPrintfulVariantId(productId: number, w: number, h: number, colorId?: string): number | null {
  const product = (productsData as any[]).find((p) => p.productId === productId);
  if (!product) return null;
  
  const sortedTarget = [w, h].sort((a, b) => a - b);
  
  for (const v of product.variants) {
    const match = v.size.match(/(\d+(?:\.\d+)?)[^\d]+(\d+(?:\.\d+)?)/);
    if (match) {
      const parsed = [Number(match[1]), Number(match[2])].sort((a,b)=>a-b);
      if (parsed[0] === sortedTarget[0] && parsed[1] === sortedTarget[1]) {
        if (colorId) {
           const mappedColor = colorId === 'oak' ? 'red oak' : colorId;
           if (v.color && v.color.toLowerCase() === mappedColor.toLowerCase()) {
             return v.id;
           }
        } else {
           return v.id;
        }
      }
    }
  }
  return null;
}

function findListingPriceCents(
  productTypeId: ProductTypeId,
  variantId: number | null,
  w: number,
  h: number
): number | null {
  const sortedTarget = [w, h].sort((a, b) => a - b);
  const sizeKey = `${sortedTarget[0]}x${sortedTarget[1]}`;

  if (productTypeId === "poster") {
    const found = (posterPrices as any[]).find(p => p.id === variantId);
    if (found) return Math.round(Number(found.listingPrice) * 100);
  } else if (productTypeId === "canvas") {
    const found = (canvasPrices as any[]).find(p => p.id === variantId);
    if (found) return Math.round(Number(found.listingPrice) * 100);
  } else if (productTypeId === "framed-poster") {
    const found = (framedPosterPrices as any[]).find(p => p.size === sizeKey);
    if (found) return Math.round(Number(found.listingPrice) * 100);
  } else if (productTypeId === "framed-canvas") {
    const found = (framedCanvasPrices as any[]).find(p => p.size === sizeKey);
    if (found) return Math.round(Number(found.listingPrice) * 100);
  }
  return null;
}

function extractColorFromEnvKey(envVarKey: string): string | undefined {
  if (envVarKey.endsWith("_Black")) return "black";
  if (envVarKey.endsWith("_White")) return "white";
  if (envVarKey.endsWith("_Oak")) return "oak";
  return undefined;
}

function resolveVariant(
  productTypeId: string,
  printfulProductId: number | null,
  variant: ProductVariant,
): ServerProductVariant {
  const colorId = extractColorFromEnvKey(variant.envVarKey);
  const variantId = printfulProductId 
    ? findPrintfulVariantId(printfulProductId, variant.widthInches, variant.heightInches, colorId) 
    : null;

  const foundPriceCents = findListingPriceCents(
    productTypeId as ProductTypeId, 
    variantId, 
    variant.widthInches, 
    variant.heightInches
  );

  return {
    ...variant,
    priceCents: foundPriceCents ?? variant.defaultPriceCents,
    variantId,
  };
}

export function getServerProductCatalog(event?: H3Event): ServerProductType[] {
  return PRODUCT_TYPES.map((product) => ({
    id: product.id,
    label: product.label,
    shortLabel: product.shortLabel,
    description: product.description,
    hasFrameOptions: product.hasFrameOptions,
    frameOptions: product.frameOptions,
    variants: product.variants.map((v) => resolveVariant(product.id, product.printfulProductId, v)),
  }));
}

export function getServerVariant(
  productTypeId: ProductTypeId,
  sizeLabel: string,
  frameColorId?: FrameColorId,
  event?: H3Event,
): ServerProductVariant | null {
  const catalog = getServerProductCatalog(event);
  const product = catalog.find((p) => p.id === productTypeId);
  if (!product) return null;

  let variants = product.variants;
  if (product.hasFrameOptions && frameColorId) {
    const colorSuffix = frameColorId.charAt(0).toUpperCase() + frameColorId.slice(1);
    variants = variants.filter((v) => v.envVarKey.endsWith(`_${colorSuffix}`));
  }

  return variants.find((v) => v.sizeLabel === sizeLabel) ?? null;
}

// ── Backward-compatible functions ──

export function getServerPosterSizes(event?: H3Event): ServerPosterSize[] {
  const catalog = getServerProductCatalog(event);
  const posterProduct = catalog.find((p) => p.id === "poster");
  
  if (!posterProduct) return [];

  return POSTER_SIZES.map((size) => {
    const mappedVariant = posterProduct.variants.find(v => v.sizeLabel === size.label);
    return {
      ...size,
      priceCents: mappedVariant?.priceCents ?? size.defaultPriceCents,
      variantId: mappedVariant?.variantId ?? null,
    };
  });
}

export function getServerPosterSizeById(
  sizeId: string,
  event?: H3Event,
): ServerPosterSize | null {
  const base = getPosterSizeById(sizeId);
  if (!base) return null;
  return getServerPosterSizes(event).find((size) => size.id === base.id) ?? null;
}

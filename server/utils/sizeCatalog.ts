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

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
}

function parseVariantId(value: string): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function envKeyToEnvName(envVarKey: string): string {
  // Convert camelCase key like "printfulVariantPoster18x24" to
  // env var name like "NUXT_PRINTFUL_VARIANT_POSTER_18X24"
  return "NUXT_" + envVarKey
    .replace(/([A-Z])/g, "_$1")
    .toUpperCase()
    .replace(/^_/, "");
}

function resolveVariant(
  config: Record<string, any>,
  variant: ProductVariant,
): ServerProductVariant {
  const envName = envKeyToEnvName(variant.envVarKey);
  const envValue = process.env[envName] || "";
  const configValue = (config as any)[variant.envVarKey] || "";
  const rawVariantId = envValue || configValue || "";

  // Price override: env var with _PRICE suffix
  const priceEnvName = envName.replace("_VARIANT_", "_PRICE_");
  const rawPrice = process.env[priceEnvName] || "";

  return {
    ...variant,
    priceCents: rawPrice
      ? parsePositiveInt(rawPrice, variant.defaultPriceCents)
      : variant.defaultPriceCents,
    variantId: parseVariantId(rawVariantId),
  };
}

export function getServerProductCatalog(event?: H3Event): ServerProductType[] {
  const config = useRuntimeConfig(event);

  return PRODUCT_TYPES.map((product) => ({
    id: product.id,
    label: product.label,
    shortLabel: product.shortLabel,
    description: product.description,
    hasFrameOptions: product.hasFrameOptions,
    frameOptions: product.frameOptions,
    variants: product.variants.map((v) => resolveVariant(config, v)),
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
    variants = variants.filter((v) => v.envVarKey.endsWith(`_${frameColorId}`));
  }

  return variants.find((v) => v.sizeLabel === sizeLabel) ?? null;
}

// ── Backward-compatible functions ──

export function getServerPosterSizes(event?: H3Event): ServerPosterSize[] {
  const config = useRuntimeConfig(event);
  const price18x24 =
    process.env.NUXT_PRICE_18X24 || config.price18x24 || "";
  const price24x36 =
    process.env.NUXT_PRICE_24X36 || config.price24x36 || "";
  const price30x40 =
    process.env.NUXT_PRICE_30X40 || config.price30x40 || "";

  const variant18x24 =
    process.env.NUXT_PRINTFUL_VARIANT_18X24 || config.printfulVariant18x24 || "";
  const variant24x36 =
    process.env.NUXT_PRINTFUL_VARIANT_24X36 || config.printfulVariant24x36 || "";
  const variant30x40 =
    process.env.NUXT_PRINTFUL_VARIANT_30X40 || config.printfulVariant30x40 || "";

  const priceById: Record<PosterSizeId, number> = {
    "18x24": parsePositiveInt(price18x24, POSTER_SIZES[0].defaultPriceCents),
    "24x36": parsePositiveInt(price24x36, POSTER_SIZES[1].defaultPriceCents),
    "30x40": parsePositiveInt(price30x40, POSTER_SIZES[2].defaultPriceCents),
  };

  const variantById: Record<PosterSizeId, number | null> = {
    "18x24": variant18x24 ? Number(variant18x24) : null,
    "24x36": variant24x36 ? Number(variant24x36) : null,
    "30x40": variant30x40 ? Number(variant30x40) : null,
  };

  return POSTER_SIZES.map((size) => ({
    ...size,
    priceCents: priceById[size.id],
    variantId:
      Number.isFinite(variantById[size.id] ?? NaN) && Number(variantById[size.id]) > 0
        ? Number(variantById[size.id])
        : null,
  }));
}

export function getServerPosterSizeById(
  sizeId: string,
  event?: H3Event,
): ServerPosterSize | null {
  const base = getPosterSizeById(sizeId);
  if (!base) return null;
  return getServerPosterSizes(event).find((size) => size.id === base.id) ?? null;
}

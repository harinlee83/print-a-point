import type { H3Event } from "h3";
import { getPosterSizeById, POSTER_SIZES, type PosterSizeId } from "~~/shared/posterSizes";

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

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
}

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

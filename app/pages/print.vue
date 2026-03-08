<template>
  <div class="app-shell">
    <header class="create-header">
      <NuxtLink to="/create" class="create-back" aria-label="Back to editor">←</NuxtLink>
      <NuxtLink to="/" class="create-brand">
        <img src="/icons/logo.svg" alt="" />
        <span class="create-brand-text">PRINTAPOINT</span>
      </NuxtLink>
      <div class="create-header-end"></div>
    </header>

    <main class="print-page">
      <div class="print-preview-col">
        <ProductPlacementPreview />
        <p class="print-preview-note">
          The "Made with printapoint.com" watermark will be <strong>removed</strong> from the final print.
        </p>
      </div>

      <div class="print-options-col">
        <ProductTypeSelector
          v-model="productTypeModel"
          :products="PRODUCT_TYPES"
        />

        <FrameColorSelector
          v-if="store.needsFrameSelection"
          v-model="frameColorModel"
          :options="store.selectedProduct.frameOptions"
        />

        <SizeSelector
          v-model="sizeModel"
          :sizes="rankedSizes"
        />

        <div class="action-row">
          <button
            type="button"
            class="generate-btn"
            :disabled="store.isCheckoutLoading"
            @click="startCheckout"
          >
            {{ buyButtonLabel }}
          </button>
          <p class="subtle-note">
            Checkout and fulfillment are securely powered by Stripe and Printful.
          </p>
        </div>

        <p v-if="store.error" class="error">{{ store.error }}</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SizeSelector from "~/components/SizeSelector.vue";
import ProductTypeSelector from "~/components/ProductTypeSelector.vue";
import FrameColorSelector from "~/components/FrameColorSelector.vue";
import ProductPlacementPreview from "~/components/ProductPlacementPreview.vue";
import { useMapStore } from "~/stores/map";
import {
  formatUsd,
  PRODUCT_TYPES,
  getRecommendedVariants
} from "~~/shared/productCatalog";
import type {
  ProductTypeId,
  FrameColorId,
  RankedVariant
} from "~~/shared/productCatalog";

const store = useMapStore();

const productTypeModel = computed<ProductTypeId>({
  get: () => store.selectedProductType,
  set: (value: ProductTypeId) => store.setProductType(value),
});

const frameColorModel = computed<FrameColorId>({
  get: () => store.selectedFrameColor,
  set: (value: FrameColorId) => store.setFrameColor(value),
});

const rankedSizes = computed(() => {
  return getRecommendedVariants(
    store.selectedProductType,
    store.aspectRatio,
    store.selectedFrameColor
  );
});

const sizeModel = computed<string>({
  get: () => store.selectedVariant?.sizeLabel ?? rankedSizes.value[0]?.sizeLabel ?? "",
  set: (value: string) => {
    const variant = rankedSizes.value.find((v: RankedVariant) => v.sizeLabel === value);
    if (variant) {
      const sizeId = `${variant.widthInches}x${variant.heightInches}`;
      store.setSize(sizeId);
    }
  },
});

const buyButtonLabel = computed(() => {
  if (store.isCheckoutLoading) {
    return "Preparing checkout…";
  }
  const variant = store.selectedVariant;
  if (variant) {
    return `Buy Print — ${formatUsd(variant.defaultPriceCents)}`;
  }
  return "Buy Print";
});

const startCheckout = async () => {
  if (store.isCheckoutLoading) {
    return;
  }

  store.clearError();
  store.setIsCheckoutLoading(true);

  try {
    let finalImageUrl = store.designUrl;
    
    // If we have a local PNG blob, we must upload it to R2 before checkout
    if (store.designPngBlob) {
      const formData = new FormData();
      formData.append("file", store.designPngBlob, "design.png");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload high-resolution design image before checkout.");
      }

      const { url } = await uploadResponse.json();
      store.setDesignUrl(url); // Also updates designUrl in store
      store.setDesignPngBlob(null); // Clear blob so we don't upload again
      finalImageUrl = url;
    }

    const checkoutBody: Record<string, any> = {
      imageUrl: finalImageUrl,
      productTypeId: store.selectedProductType,
      sizeLabel: store.selectedVariant?.sizeLabel ?? "",
      locationLabel: store.location,
      displayCity: store.displayCity,
      displayCountry: store.displayCountry,
      themeId: store.selectedThemeId,
    };
    if (store.needsFrameSelection) {
      checkoutBody.frameColor = store.selectedFrameColor;
    }

    const checkoutResponse = await $fetch<{ url: string }>("/api/checkout", {
      method: "POST",
      body: checkoutBody,
    });

    if (!checkoutResponse.url) {
      throw new Error("Checkout URL was not returned.");
    }

    window.location.href = checkoutResponse.url;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start checkout. Please try again.";
    store.setError(message);
  } finally {
    store.setIsCheckoutLoading(false);
  }
};
</script>

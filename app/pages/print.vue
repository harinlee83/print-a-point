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
        <div class="print-preview-card" :style="previewAspectStyle">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            alt="Your design"
            class="print-preview-img"
          />
          <div v-else class="print-preview-placeholder">
            <p>Generating preview…</p>
          </div>
        </div>
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
          :sizes="store.availableSizes"
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
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { Map as MapLibreMap } from "maplibre-gl";
import SizeSelector from "~/components/SizeSelector.vue";
import ProductTypeSelector from "~/components/ProductTypeSelector.vue";
import FrameColorSelector from "~/components/FrameColorSelector.vue";
import { useMapStore } from "~/stores/map";
import {
  formatUsd,
  PRODUCT_TYPES,
  type ProductTypeId,
  type FrameColorId,
} from "~~/shared/productCatalog";

const store = useMapStore();
const previewUrl = ref<string | null>(null);

// Generate a preview from the stored design on mount
onMounted(async () => {
  // The preview will be generated in the future when we wire up
  // cross-page export. For now we rely on the store's state.
});

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});

const previewAspectStyle = computed(() => ({
  aspectRatio: `${store.aspectRatio}`,
}));

const productTypeModel = computed<ProductTypeId>({
  get: () => store.selectedProductType,
  set: (value: ProductTypeId) => store.setProductType(value),
});

const frameColorModel = computed<FrameColorId>({
  get: () => store.selectedFrameColor,
  set: (value: FrameColorId) => store.setFrameColor(value),
});

const sizeModel = computed<string>({
  get: () => store.selectedVariant?.sizeLabel ?? store.availableSizes[0]?.sizeLabel ?? "",
  set: (value: string) => {
    const variant = store.availableSizes.find((v: any) => v.sizeLabel === value);
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
    // For now, direct to Stripe checkout
    // In the future this will upload to R2 and create a Stripe session
    const checkoutBody: Record<string, any> = {
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

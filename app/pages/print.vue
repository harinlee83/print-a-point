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
        <div class="print-options-scroll">
          <ProductTypeSelector
            v-model="productTypeModel"
            :products="PRODUCT_TYPES"
          />

          <FrameColorSelector
            v-if="store.needsFrameSelection"
            v-model="frameColorModel"
            :options="store.selectedProduct.frameOptions"
          />

          <!-- Product Details -->
          <section class="panel-block">
            <h2>Product Info</h2>
            <div class="product-details-content">
              <p class="product-description">{{ store.selectedProduct.description }}</p>
              <ul v-if="store.selectedProduct.features && store.selectedProduct.features.length" class="product-features">
                <li v-for="feature in store.selectedProduct.features" :key="feature">{{ feature }}</li>
              </ul>
            </div>
          </section>

          <SizeSelector
            v-model="sizeModel"
            :sizes="rankedSizes"
            :orientation="store.selectedOrientation"
          />
        </div>

        <div class="print-options-fixed">
          <div class="action-row">
            <button
              type="button"
              class="generate-btn"
              :disabled="!userHasChosenSize || store.isCheckoutLoading"
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
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
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

const userHasChosenSize = ref(false);

const sizeModel = computed<string>({
  get: () => {
    if (!userHasChosenSize.value) return "";
    return store.selectedVariant?.sizeLabel ?? rankedSizes.value[0]?.sizeLabel ?? "";
  },
  set: (value: string) => {
    const variant = rankedSizes.value.find((v: RankedVariant) => v.sizeLabel === value);
    if (variant) {
      userHasChosenSize.value = true;
      const sizeId = `${variant.widthInches}x${variant.heightInches}`;
      store.setSize(sizeId);
    }
  },
});

const buyButtonLabel = computed(() => {
  if (!userHasChosenSize.value) {
    return "Choose a Size";
  }
  if (store.isCheckoutLoading) {
    return "Redirecting to Stripe…";
  }
  const variant = store.selectedVariant;
  if (variant) {
    return `Buy Print — ${formatUsd(variant.defaultPriceCents)}`;
  }
  return "Buy Print";
});

function autoSelectLargestSize() {
  if (rankedSizes.value && rankedSizes.value.length > 0) {
    const largest = rankedSizes.value[rankedSizes.value.length - 1];
    if (largest) {
      userHasChosenSize.value = true;
      const sizeId = `${largest.widthInches}x${largest.heightInches}`;
      store.setSize(sizeId);
    }
  }
}

onMounted(() => {
  if (!userHasChosenSize.value) {
    autoSelectLargestSize();
  }
});

watch(rankedSizes, (newSizes, oldSizes) => {
  // If the available sizes change (e.g. product format changed), auto select the largest available
  if (newSizes && newSizes.length > 0) {
    autoSelectLargestSize();
  }
});

const startCheckout = async () => {
  if (!userHasChosenSize.value || store.isCheckoutLoading) {
    return;
  }

  store.clearError();
  store.setIsCheckoutLoading(true);

  try {
    let finalImageUrl = store.designUrl;

    // Upload to R2 at checkout time
    if (store.designPngBlob) {
      const { uploadUrl, publicFileUrl } = await $fetch<{
        uploadUrl: string;
        publicFileUrl: string;
      }>("/api/upload-url", { method: "POST" });

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: store.designPngBlob,
      });

      if (!putResponse.ok) {
        throw new Error("Failed to upload high-resolution design image.");
      }

      store.setDesignUrl(publicFileUrl);
      store.setDesignPngBlob(null);
      finalImageUrl = publicFileUrl;
    }

    const checkoutBody: Record<string, any> = {
      imageUrl: finalImageUrl,
      productTypeId: store.selectedProductType,
      sizeLabel: store.selectedVariant?.sizeLabel ?? "",
      locationLabel: store.location,
      displayCity: store.displayCity,
      displayCountry: store.displayCountry,
      themeId: store.selectedThemeId,
      orientation: store.selectedOrientation,
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

<style scoped>
.product-details-content {
  color: var(--ink);
}

.product-description {
  margin: 0 0 1rem;
  font-size: 0.88rem;
  line-height: 1.6;
}

.product-features {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--muted);
}

.product-features li {
  margin-bottom: 0.4rem;
}
</style>

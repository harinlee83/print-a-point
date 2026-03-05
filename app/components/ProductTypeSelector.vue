<template>
  <section class="panel-block">
    <h2>Product Format</h2>
    <div class="product-type-grid">
      <button
        v-for="product in products"
        :key="product.id"
        type="button"
        :class="['product-type-card', { 'is-active': product.id === modelValue }]"
        @click="$emit('update:modelValue', product.id)"
      >
        <p class="product-type-label">{{ product.shortLabel }}</p>
        <p class="product-type-price">from {{ formatUsd(getStartingPrice(product.id)) }}</p>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ProductType, ProductTypeId } from "~~/shared/productCatalog";
import { formatUsd, getStartingPrice } from "~~/shared/productCatalog";

defineProps<{
  products: ProductType[];
  modelValue: ProductTypeId;
}>();

defineEmits<{
  "update:modelValue": [value: ProductTypeId];
}>();
</script>

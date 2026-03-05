<template>
  <section class="panel-block">
    <h2>Print Size</h2>
    <div class="size-grid">
      <button
        v-for="size in sizes"
        :key="size.sizeLabel"
        type="button"
        :class="['size-card', { 'is-active': size.sizeLabel === modelValue }]"
        @click="$emit('update:modelValue', size.sizeLabel)"
      >
        <p class="size-title">{{ size.sizeLabel }}</p>
        <p class="size-meta">
          {{ size.widthCm.toFixed(1) }} x {{ size.heightCm.toFixed(1) }} cm
        </p>
        <p class="size-price">{{ formatUsd(size.defaultPriceCents) }}</p>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ProductVariant } from "~~/shared/productCatalog";
import { formatUsd } from "~~/shared/productCatalog";

defineProps<{
  sizes: ProductVariant[];
  modelValue: string;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

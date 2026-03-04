<template>
  <section class="panel-block">
    <h2>Print Size</h2>
    <div class="size-grid">
      <button
        v-for="size in sizes"
        :key="size.id"
        type="button"
        :class="['size-card', { 'is-active': size.id === modelValue }]"
        @click="$emit('update:modelValue', size.id)"
      >
        <p class="size-title">{{ size.label }}</p>
        <p class="size-meta">
          {{ size.widthCm.toFixed(1) }} x {{ size.heightCm.toFixed(1) }} cm
        </p>
        <p class="size-price">{{ formatUsd(size.defaultPriceCents) }}</p>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PosterSize, PosterSizeId } from "~~/shared/posterSizes";
import { formatUsd } from "~~/shared/posterSizes";

defineProps<{
  sizes: PosterSize[];
  modelValue: PosterSizeId;
}>();

defineEmits<{
  "update:modelValue": [value: PosterSizeId];
}>();
</script>

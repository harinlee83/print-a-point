<template>
  <section class="panel-block">
    <h2>Frame Color</h2>
    <div class="frame-color-grid">
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        :class="['frame-color-swatch', { 'is-active': option.id === modelValue }]"
        :title="option.label"
        @click="$emit('update:modelValue', option.id)"
      >
        <span class="frame-color-dot" :style="{ background: option.colorHex }" />
        <span class="frame-color-label">{{ option.label }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FrameOption, FrameColorId } from "~~/shared/productCatalog";

defineProps<{
  options: FrameOption[];
  modelValue: FrameColorId;
}>();

defineEmits<{
  "update:modelValue": [value: FrameColorId];
}>();
</script>

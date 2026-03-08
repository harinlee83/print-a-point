<template>
  <section class="panel-block">
    <h2 class="size-header-wrap">
      Print Size
      <div class="info-tooltip-wrap">
        <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div class="tooltip-content">
          Can't find your size? Go back to the editor and try choosing a different aspect ratio.
        </div>
      </div>
    </h2>
    <div class="size-grid">
      <button
        v-for="size in sizes"
        :key="size.sizeLabel"
        type="button"
        :class="[
          'size-card',
          { 'is-active': size.sizeLabel === modelValue }
        ]"
        @click="$emit('update:modelValue', size.sizeLabel)"
      >
        <p class="size-title">
          {{ orientation === 'landscape' ? `${size.heightInches}x${size.widthInches}` : size.sizeLabel }}
        </p>
        <p class="size-meta">
          <template v-if="orientation === 'landscape'">
            {{ size.heightCm.toFixed(1) }} x {{ size.widthCm.toFixed(1) }} cm
          </template>
          <template v-else>
            {{ size.widthCm.toFixed(1) }} x {{ size.heightCm.toFixed(1) }} cm
          </template>
        </p>
        <p class="size-price">{{ formatUsd(size.defaultPriceCents) }}</p>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RecommendedVariant } from "~~/shared/productCatalog";
import { formatUsd } from "~~/shared/productCatalog";

defineProps<{
  sizes: RecommendedVariant[];
  modelValue: string;
  orientation?: "portrait" | "landscape";
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<style scoped>
/* Redundant card styles removed, using main.css instead */
.size-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  text-align: left;
  transition: all 0.2s ease;
  min-height: 100px;
}

.size-card.is-active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
  background: color-mix(in srgb, var(--accent) 5%, var(--surface));
}

.size-title {
  font-weight: 600;
  font-size: 1.05rem;
  margin: 0;
}

.size-meta {
  font-size: 0.75rem;
  color: var(--muted);
  margin: 0;
}

.size-price {
  font-weight: 700;
  color: var(--accent);
  margin-top: 0.25rem;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.9rem;
}
.size-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
  max-height: 240px;
  overflow-y: auto;
  padding: 0.5rem;
  margin: -0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) transparent;
}

.size-grid::-webkit-scrollbar {
  width: 6px;
}

.size-grid::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 10px;
}

.size-grid::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

.size-header-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-tooltip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  cursor: help;
}

.info-icon {
  width: 14px;
  height: 14px;
}

.tooltip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  width: max-content;
  max-width: 200px;
  padding: 0.6rem 0.8rem;
  background: var(--ink);
  color: var(--surface);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  border-radius: 6px;
  text-transform: none;
  letter-spacing: normal;
  text-align: center;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tooltip-content::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: var(--ink) transparent transparent transparent;
}

.info-tooltip-wrap:hover .info-icon {
  color: var(--accent);
}

.info-tooltip-wrap:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-4px);
}
</style>

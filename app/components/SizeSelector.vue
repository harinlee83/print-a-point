<template>
  <section class="panel-block">
    <h2>Print Size</h2>
    <div class="size-grid">
      <button
        v-for="size in sizes"
        :key="size.sizeLabel"
        type="button"
        :class="[
          'size-card',
          { 'is-active': size.sizeLabel === modelValue },
          size.matchLevel ? `match-${size.matchLevel}` : ''
        ]"
        @click="$emit('update:modelValue', size.sizeLabel)"
      >
        <div v-if="size.matchLevel === 'best' || size.matchLevel === 'near'" class="match-badge">
          {{ size.matchLevel === 'best' ? 'Best Match' : 'Good Match' }}
        </div>
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
import type { RankedVariant } from "~~/shared/productCatalog";
import { formatUsd } from "~~/shared/productCatalog";

defineProps<{
  sizes: RankedVariant[];
  modelValue: string;
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

.match-badge {
  position: absolute;
  top: -8px;
  left: 12px;
  background: var(--accent);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.match-near .match-badge {
  background: var(--muted);
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
  max-height: 400px;
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
</style>

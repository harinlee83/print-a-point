<template>
  <div class="placement-preview">
    <!-- No design URL -->
    <div v-if="!imageUrl" class="placement-empty">
      <p>No design available</p>
      <NuxtLink to="/create" class="placement-back-link">Back to editor</NuxtLink>
    </div>

    <template v-else>
      <!-- View toggle -->
      <div class="view-toggle">
        <button
          type="button"
          :class="['view-toggle-btn', { active: viewMode === 'product' }]"
          @click="viewMode = 'product'"
        >
          Product
        </button>
        <button
          type="button"
          :class="['view-toggle-btn', { active: viewMode === 'room' }]"
          @click="viewMode = 'room'"
        >
          Room Preview
        </button>
      </div>

      <!-- Product view (3D) -->
      <template v-if="viewMode === 'product'">
        <ProductPreview3D />
        <div class="placement-info">
          <span class="placement-info-hint">drag to rotate • scroll to zoom</span>
        </div>
      </template>

      <!-- Room view -->
      <template v-else>
        <RoomPreview />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useMapStore } from "~/stores/map";
import ProductPreview3D from "~/components/ProductPreview3D.vue";
import RoomPreview from "~/components/RoomPreview.vue";

const store = useMapStore();

const imageUrl = computed(() => store.designUrl);
const viewMode = ref<"product" | "room">("product");
</script>

<style scoped>
.placement-preview {
  position: relative;
  width: 100%;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.placement-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--muted);
}

.placement-back-link {
  margin-top: 1rem;
  color: var(--accent);
  text-decoration: underline;
}

/* ── View toggle ── */
.view-toggle {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  gap: 2px;
  background: rgba(38, 35, 32, 0.7);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.view-toggle-btn {
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.02em;
}

.view-toggle-btn:hover {
  color: var(--ink-light, #e8dfd0);
}

.view-toggle-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--ink-light, #e8dfd0);
}

/* ── Info bar ── */
.placement-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.82rem;
  color: var(--muted);
  position: absolute;
  top: 4.5rem;
  bottom: auto;
  left: 50%;
  transform: translateX(-50%);
  right: auto;
  z-index: 10;
  background: rgba(38, 35, 32, 0.75);
  backdrop-filter: blur(8px);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.placement-info-hint {
  font-size: 0.7rem;
  opacity: 0.5;
  font-style: italic;
}
</style>

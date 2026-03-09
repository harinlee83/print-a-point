<template>
  <div class="placement-preview">
    <!-- No design URL -->
    <div v-if="!imageUrl" class="placement-empty">
      <p>No design available</p>
      <NuxtLink to="/create" class="placement-back-link">Back to editor</NuxtLink>
    </div>

    <template v-else>
      <ClientOnly>
        <ProductPreview3D />
      </ClientOnly>

      <!-- Info bar -->
      <div class="placement-info">
        <span class="placement-info-hint">drag to rotate • scroll to zoom</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMapStore } from "~/stores/map";
import ProductPreview3D from "~/components/ProductPreview3D.vue";

const store = useMapStore();

const imageUrl = computed(() => store.designUrl);
</script>

<style scoped>
.placement-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding-bottom: 3rem;
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

.placement-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.82rem;
  color: var(--muted);
  position: absolute;
  bottom: 2rem;
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

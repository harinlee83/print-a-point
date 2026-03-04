<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="preview-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Preview poster in different settings"
      @click.self="close"
    >
      <div class="preview-modal">
        <button
          type="button"
          class="preview-modal-close"
          aria-label="Close preview"
          @click="close"
        >
          ×
        </button>

        <div class="preview-modal-content">
          <button
            type="button"
            class="preview-nav preview-nav--prev"
            aria-label="Previous setting"
            :disabled="currentIndex === 0"
            @click="prev"
          >
            ‹
          </button>

          <div class="preview-mockup">
            <div
              v-if="imageUrl"
              class="preview-mockup-inner"
              :class="`preview-mockup--${mockups[currentIndex].id}`"
            >
              <img
                :src="imageUrl"
                :alt="`Poster in ${mockups[currentIndex].label}`"
                class="preview-poster-img"
              />
            </div>
            <div v-else class="preview-mockup-loading">
              Preparing preview...
            </div>
          </div>

          <button
            type="button"
            class="preview-nav preview-nav--next"
            aria-label="Next setting"
            :disabled="currentIndex === mockups.length - 1"
            @click="next"
          >
            ›
          </button>
        </div>

        <p class="preview-modal-label">{{ mockups[currentIndex].label }}</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  open: boolean;
  imageUrl: string | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const mockups = [
  { id: "wall", label: "On a wall" },
  { id: "frame", label: "In a frame" },
  { id: "stand", label: "On a stand" },
  { id: "desk", label: "On a desk" },
];

const currentIndex = ref(0);

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

function next() {
  if (currentIndex.value < mockups.length - 1) {
    currentIndex.value++;
  }
}

function close() {
  emit("close");
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      currentIndex.value = 0;
    }
  },
);
</script>

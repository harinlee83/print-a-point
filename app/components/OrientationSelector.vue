<template>
  <section class="panel-block orientation-block">
    <h2>Orientation</h2>
    <div class="orientation-controls">
      <button
        type="button"
        class="orientation-btn"
        :class="{ 'is-active': modelValue === 'portrait' }"
        @click="$emit('update:modelValue', 'portrait')"
      >
        <div class="orientation-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="3" width="12" height="18" rx="2" />
          </svg>
        </div>
        <span>Vertical</span>
      </button>

      <button
        type="button"
        class="orientation-btn"
        :class="{ 'is-active': modelValue === 'landscape' }"
        @click="$emit('update:modelValue', 'landscape')"
      >
        <div class="orientation-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="6" width="18" height="12" rx="2" />
          </svg>
        </div>
        <span>Horizontal</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: "portrait" | "landscape";
}>();

defineEmits<{
  "update:modelValue": [value: "portrait" | "landscape"];
}>();
</script>

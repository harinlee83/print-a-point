<template>
  <div class="mockup-preview-container">
    <div v-if="loading" class="mockup-loading">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
      <div v-if="progress > 0" class="progress-bar-container">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
    
    <div v-else-if="error" class="mockup-error">
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-btn">Retry</button>
    </div>
    
    <div v-else-if="mockupUrl" class="mockup-image-wrapper">
      <img :src="mockupUrl" alt="Product Mockup" class="mockup-img" />
    </div>
    
    <div v-else class="mockup-placeholder">
      <p>No preview available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
  loadingMessage: string;
  progress: number;
  mockupUrl: string | null;
  error: string | null;
}>();

defineEmits<{
  (e: "retry"): void;
}>();
</script>

<style scoped>
.mockup-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.mockup-loading, .mockup-error, .mockup-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(232, 223, 208, 0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.25rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-bar-container {
  width: min(240px, 80%);
  height: 4px;
  background: var(--line);
  border-radius: 2px;
  margin-top: 1.25rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.mockup-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.retry-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  color: var(--accent-ink);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.retry-btn:hover {
  background: var(--accent-strong);
  transform: translateY(-1px);
}
</style>

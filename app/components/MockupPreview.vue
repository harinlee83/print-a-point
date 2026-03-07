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
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.mockup-loading, .mockup-error, .mockup-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-bar-container {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 1rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent-primary);
  transition: width 0.3s ease;
}

.mockup-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--accent-primary);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.retry-btn:hover {
  filter: brightness(1.1);
}
</style>

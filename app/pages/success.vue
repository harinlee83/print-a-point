<template>
  <div class="success-shell">
    <section class="success-card">
      <div class="success-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="var(--accent)" />
          <path d="M14 24.5L21 31.5L34 18.5" stroke="var(--accent-ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <h1>Order Confirmed</h1>

      <div v-if="loading" class="success-loading">Loading order details...</div>

      <template v-else>
        <div class="success-details">
          <p v-if="customerEmail">
            A confirmation email was sent to <strong>{{ customerEmail }}</strong>.
          </p>
          <p>
            Your print is now in the production queue. Typical delivery is 3-5 business days for production, plus shipping.
          </p>
        </div>

      </template>

      <NuxtLink class="generate-btn" to="/create">Design Another</NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const loading = ref(false);
const customerEmail = ref("");

onMounted(async () => {
  const sessionId = String(route.query.session_id ?? "").trim();
  if (!sessionId) {
    return;
  }

  loading.value = true;

  try {
    const response = await $fetch<{ customerEmail?: string }>(
      `/api/stripe-session?id=${encodeURIComponent(sessionId)}`,
    );
    customerEmail.value = String(response.customerEmail ?? "").trim();
  } catch {
    // Keep generic success view when session lookup fails.
  } finally {
    loading.value = false;
  }
});
</script>

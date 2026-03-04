<template>
  <div class="success-shell">
    <section class="success-card">
      <h1>Order Confirmed</h1>
      <p v-if="loading">Loading your order details...</p>
      <template v-else>
        <p v-if="customerEmail">
          A confirmation email was sent to <strong>{{ customerEmail }}</strong>.
        </p>
        <p>
          Your poster is now in the print queue. Typical delivery is 3-5 business days for production, plus shipping.
        </p>
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

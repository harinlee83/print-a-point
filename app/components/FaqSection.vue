<template>
  <section class="faq-section" aria-label="Frequently asked questions">
    <h2 class="faq-heading">Frequently Asked Questions</h2>
    <div class="faq-list">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="faq-item"
        :class="{ 'is-open': openIndex === idx }"
      >
        <button
          type="button"
          class="faq-question"
          :aria-expanded="openIndex === idx"
          :aria-controls="`faq-answer-${idx}`"
          :id="`faq-question-${idx}`"
          @click="toggle(idx)"
        >
          {{ item.question }}
        </button>
        <div
          :id="`faq-answer-${idx}`"
          class="faq-answer"
          role="region"
          :aria-labelledby="`faq-question-${idx}`"
        >
          <div class="faq-answer-inner">
            <p v-for="(p, i) in item.answer" :key="i">{{ p }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const openIndex = ref<number | null>(null);

function toggle(idx: number) {
  openIndex.value = openIndex.value === idx ? null : idx;
}
interface FaqItem {
  question: string;
  answer: string[];
}

const items: FaqItem[] = [
  {
    question: "What is PrintAPoint?",
    answer: [
      "PrintAPoint lets you create custom map posters from any location. Choose a place, pick a style, and get a high-quality print delivered to your door.",
    ],
  },
  {
    question: "How does checkout work?",
    answer: [
      "Checkout is powered by Stripe for secure payment processing. Your payment information is handled directly by Stripe and never stored by us.",
    ],
  },
  {
    question: "Who prints and ships my poster?",
    answer: [
      "Printing and fulfillment are handled by Printful. They produce your poster at print quality and ship it to you. We work with Printful to ensure high-quality output.",
    ],
  },
  {
    question: "Where does the map data come from?",
    answer: [
      "Map data © OpenStreetMap contributors. Tiles by OpenFreeMap and OpenMapTiles. Geocoding by Nominatim. Rendering with MapLibre.",
    ],
  },
  {
    question: "Will the watermark appear on my print?",
    answer: [
      "No. The 'Made with printapoint.com' watermark shown in the preview is removed from your final print. You receive a clean poster.",
    ],
  },
];
</script>

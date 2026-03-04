<template>
  <div class="poster-fades">
    <div
      class="poster-fade poster-fade--top"
      :style="{ background: `linear-gradient(to bottom, ${solid}, ${transparent})` }"
    />
    <div
      class="poster-fade poster-fade--bottom"
      :style="{ background: `linear-gradient(to top, ${solid}, ${transparent})` }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { withAlpha } from "~/lib/utils/color";

const props = defineProps<{
  color: string;
}>();

const solid = computed(() => withAlpha(props.color, 1));
const transparent = computed(() => withAlpha(props.color, 0));
</script>

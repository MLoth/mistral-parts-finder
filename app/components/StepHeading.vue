<script setup lang="ts">
defineProps<{ title: string, hint?: string }>()
</script>

<template>
  <div>
    <h2 class="text-lg leading-7">
      {{ title }}
    </h2>
    <p
      v-if="hint"
      class="text-sm text-muted"
    >
      {{ hint }}
    </p>
  </div>
</template>

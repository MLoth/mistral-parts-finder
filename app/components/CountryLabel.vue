<script setup lang="ts">
defineProps<{ code?: string | null, location?: string }>()
</script>

<template>
  <span
    v-if="code || location"
    class="inline-flex items-center gap-1 rounded-md border border-default px-1.5 py-0.5 text-xs"
  >
    <UIcon
      v-if="code"
      :name="`i-circle-flags-${code}`"
      class="size-4"
    />
    {{ location || code?.toUpperCase() }}
  </span>
</template>

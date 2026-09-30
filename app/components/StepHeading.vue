<script setup lang="ts">
defineProps<{ title: string, hint?: string, done?: boolean }>()
</script>

<template>
  <div class="flex items-start gap-3">
    <span
      class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold"
      :class="done ? 'bg-primary text-inverted' : 'bg-elevated text-muted'"
    >
      <UIcon
        v-if="done"
        name="i-lucide-check"
        class="size-4"
      />
      <span
        v-else
        class="size-2 rounded-full bg-muted"
      />
    </span>
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
  </div>
</template>

<script setup lang="ts">
import type { SearchJob } from '#shared/types/search'

defineProps<{ job: SearchJob }>()
defineEmits<{ retry: [] }>()

const time = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
</script>

<template>
  <UAlert
    v-if="job.status === 'failed'"
    color="error"
    variant="subtle"
    icon="i-lucide-circle-alert"
    title="Zoeken in de bronnen is mislukt"
    :description="job.error"
    :actions="[{ label: 'Opnieuw proberen', color: 'neutral', variant: 'subtle', onClick: () => $emit('retry') }]"
  />

  <div
    v-else-if="job.status === 'running'"
    class="space-y-3 rounded-md border border-default p-4"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-center gap-2">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-5 animate-spin text-primary"
      />
      <p class="font-semibold">
        {{ job.stage === 'ranking' ? 'Resultaten beoordelen…' : 'Bronnen doorzoeken…' }}
      </p>
      <span class="text-sm text-muted">gestart om {{ time(job.startedAt) }}</span>
    </div>
    <ul class="space-y-1 text-sm">
      <li
        v-for="s in job.sources"
        :key="s.id"
        class="flex items-center gap-2"
      >
        <UIcon
          :name="s.state === 'pending' ? 'i-lucide-loader-circle' : s.state === 'done' ? 'i-lucide-check' : 'i-lucide-x'"
          class="size-4"
          :class="{ 'animate-spin text-muted': s.state === 'pending', 'text-success': s.state === 'done', 'text-error': s.state === 'failed' }"
        />
        <span>{{ s.name }}</span>
        <span
          v-if="s.state === 'done'"
          class="text-muted"
        >{{ s.count }} resultaten</span>
        <span
          v-if="s.state === 'failed'"
          class="text-error"
        >mislukt{{ s.attempts && s.attempts > 1 ? ` na ${s.attempts} pogingen` : '' }}: {{ s.error }}</span>
      </li>
    </ul>
    <p class="text-sm text-muted">
      Je kunt deze pagina verlaten. De zoekopdracht loopt door en de resultaten staan er straks.
    </p>
  </div>
</template>

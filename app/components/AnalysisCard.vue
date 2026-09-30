<script setup lang="ts">
import type { PartAnalysis } from '#shared/types/search'

defineProps<{ analysis: PartAnalysis, flat?: boolean }>()
const CONFIDENCE = {
  low: { label: 'Lage zekerheid', color: 'warning' },
  medium: { label: 'Gemiddelde zekerheid', color: 'info' },
  high: { label: 'Hoge zekerheid', color: 'success' }
} as const
</script>

<template>
  <div
    class="space-y-3"
    :class="flat ? '' : 'rounded-md border border-default p-4'"
  >
    <div class="flex flex-wrap items-center gap-2">
      <h3 class="text-base">
        {{ analysis.partName }}
      </h3>
      <UBadge
        :label="CONFIDENCE[analysis.confidence].label"
        :color="CONFIDENCE[analysis.confidence].color"
        variant="subtle"
      />
      <UBadge
        v-if="analysis.category"
        :label="analysis.category"
        color="neutral"
        variant="outline"
      />
    </div>
    <p class="text-sm">
      {{ analysis.explanation }}
    </p>

    <dl class="space-y-2 text-sm">
      <div v-if="analysis.alternativeNames.length">
        <dt class="text-muted">
          Ook bekend als
        </dt>
        <dd>{{ analysis.alternativeNames.join(', ') }}</dd>
      </div>
      <div v-if="analysis.possiblePartNumbers.length">
        <dt class="text-muted">
          Mogelijke onderdeelnummers
        </dt>
        <dd class="flex flex-wrap gap-1">
          <UBadge
            v-for="n in analysis.possiblePartNumbers"
            :key="n"
            :label="n"
            color="neutral"
            variant="subtle"
          />
        </dd>
      </div>
      <div v-if="analysis.searchQueries.length">
        <dt class="text-muted">
          Zoektermen
        </dt>
        <dd class="flex flex-wrap gap-1">
          <UBadge
            v-for="q in analysis.searchQueries"
            :key="q"
            :label="q"
            color="primary"
            variant="subtle"
          />
        </dd>
      </div>
    </dl>

    <UAlert
      v-if="analysis.questions.length"
      color="info"
      variant="subtle"
      icon="i-lucide-message-circle-question"
      title="Om dit scherper te krijgen"
    >
      <template #description>
        <ul class="list-disc ps-4">
          <li
            v-for="q in analysis.questions"
            :key="q"
          >
            {{ q }}
          </li>
        </ul>
      </template>
    </UAlert>
  </div>
</template>

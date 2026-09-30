<script setup lang="ts">
import type { SourceRatingSummary } from '#shared/types/ratings'

defineProps<{ rating?: SourceRatingSummary | null }>()
</script>

<template>
  <UBadge
    v-if="rating && rating.good + rating.bad > 0"
    :label="`Bron ${rating.score}%`"
    :icon="rating.score >= 50 ? 'i-lucide-thumbs-up' : 'i-lucide-thumbs-down'"
    :color="rating.score >= 70 ? 'success' : rating.score >= 40 ? 'neutral' : 'error'"
    :title="`${rating.good}× goed, ${rating.bad}× slecht beoordeeld`"
    variant="subtle"
  />
</template>

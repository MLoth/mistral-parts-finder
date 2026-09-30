<script setup lang="ts">
import type { SourceResult, SourceRun } from '#shared/types/sourcing'

defineProps<{ run: SourceRun, savedIds?: string[] }>()
defineEmits<{ save: [result: SourceResult] }>()

const KIND = { webshop: 'Webshop', marketplace: 'Marktplaats', seller: 'Verkoper', forum: 'Forum' } as const
const CONDITION = { new: 'Nieuw', used: 'Gebruikt', refurbished: 'Gereviseerd' } as const
const money = (p: { amount: number, currency: string }) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: p.currency }).format(p.amount)
const scoreColor = (n = 0) => (n >= 70 ? 'success' : n >= 40 ? 'warning' : 'neutral')
</script>

<template>
  <div class="space-y-3">
    <UAlert
      v-if="run.ranking === 'heuristic'"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      description="De AI-beoordeling mislukte. De volgorde is een schatting op basis van de zoektermen."
    />

    <UAlert
      v-if="run.results.some(r => r.sourceId === 'demo')"
      color="warning"
      variant="subtle"
      icon="i-lucide-flask-conical"
      description="Dit zijn demo-resultaten: ze zijn verzonnen en de links werken niet. Echte bronnen zijn nog niet gekoppeld."
    />

    <UAlert
      v-if="run.hiddenBlacklisted"
      color="neutral"
      variant="subtle"
      icon="i-lucide-eye-off"
      :description="`${run.hiddenBlacklisted} resultaten van geblokkeerde bronnen zijn verborgen.`"
    />

    <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>{{ run.results.length }} resultaten, beste eerst</span>
      <UBadge
        v-for="s in run.statuses"
        :key="s.sourceId"
        :label="s.ok ? `${s.sourceName}: ${s.count}` : `${s.sourceName}: mislukt`"
        :title="s.error"
        :color="s.ok ? 'neutral' : 'error'"
        variant="subtle"
      />
    </div>

    <ul class="space-y-2">
      <li
        v-for="r in run.results"
        :key="r.id"
        class="rounded-md border border-default p-3 text-sm space-y-1"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <a
            :href="r.url"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-primary hover:underline"
          >{{ r.title }}</a>
          <div class="flex items-center gap-2">
            <span
              v-if="r.price"
              class="font-semibold"
            >{{ money(r.price) }}</span>
            <SourceScoreBadge :rating="r.sourceRating" />
            <UBadge
              v-if="r.score !== undefined"
              :label="`Match ${r.score}%`"
              :color="scoreColor(r.score)"
              variant="subtle"
            />
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-1">
          <UBadge
            :label="KIND[r.kind]"
            color="neutral"
            variant="subtle"
          />
          <UBadge
            v-if="r.condition"
            :label="CONDITION[r.condition]"
            color="neutral"
            variant="outline"
          />
          <CountryLabel
            :code="r.countryCode"
            :location="r.location"
          />
        </div>
        <p
          v-if="r.reason"
          class="flex gap-1"
        >
          <UIcon
            name="i-lucide-lightbulb"
            class="mt-0.5 shrink-0 text-primary"
          />
          <span>{{ r.reason }}</span>
        </p>
        <p class="text-muted">
          {{ r.sourceName }}<template v-if="r.alsoFoundOn.length">
            (ook bij {{ r.alsoFoundOn.join(', ') }})
          </template><template v-if="r.seller">
            · {{ r.seller.name }} · {{ r.seller.contact }}
          </template>
        </p>
        <p v-if="r.snippet">
          {{ r.snippet }}
        </p>
        <UButton
          :label="savedIds?.includes(r.id) ? 'Opgeslagen' : 'Opslaan bij onderdeel'"
          :icon="savedIds?.includes(r.id) ? 'i-lucide-check' : 'i-lucide-bookmark'"
          size="xs"
          color="neutral"
          variant="subtle"
          :disabled="savedIds?.includes(r.id)"
          @click="$emit('save', r)"
        />
      </li>
    </ul>
  </div>
</template>

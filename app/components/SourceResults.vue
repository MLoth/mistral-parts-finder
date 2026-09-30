<script setup lang="ts">
import type { SourceRun } from '#shared/types/sourcing'

defineProps<{ run: SourceRun }>()

const KIND = { webshop: 'Webshop', marketplace: 'Marktplaats', seller: 'Verkoper', forum: 'Forum' } as const
const CONDITION = { new: 'Nieuw', used: 'Gebruikt', refurbished: 'Gereviseerd' } as const
const money = (p: { amount: number, currency: string }) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: p.currency }).format(p.amount)
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>{{ run.results.length }} resultaten</span>
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
          <span
            v-if="r.price"
            class="font-semibold"
          >{{ money(r.price) }}</span>
        </div>
        <div class="flex flex-wrap gap-1">
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
          <UBadge
            v-if="r.location"
            :label="r.location"
            color="neutral"
            variant="outline"
          />
        </div>
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
      </li>
    </ul>
  </div>
</template>

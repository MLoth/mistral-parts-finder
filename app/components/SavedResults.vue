<script setup lang="ts">
import { CONTACT_OUTCOMES, type ContactOutcome, type SavedResult } from '#shared/types/saved'

defineProps<{ saved: SavedResult[] }>()
const emit = defineEmits<{
  remove: [id: string]
  contact: [id: string, entry: { note: string, outcome: ContactOutcome }]
}>()

const drafts = reactive<Record<string, { note: string, outcome: ContactOutcome }>>({})
const draft = (id: string) => (drafts[id] ??= { note: '', outcome: 'contacted' })

const money = (p: { amount: number, currency: string }) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: p.currency }).format(p.amount)

function add(id: string) {
  emit('contact', id, { ...draft(id) })
  drafts[id] = { note: '', outcome: 'contacted' }
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="s in saved"
      :key="s.id"
      class="rounded-md border border-default p-4 space-y-3 text-sm"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <a
          :href="s.result.url"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-primary hover:underline"
        >{{ s.result.title }}</a>
        <div class="flex items-center gap-2">
          <span
            v-if="s.result.price"
            class="font-semibold"
          >{{ money(s.result.price) }}</span>
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            aria-label="Opgeslagen resultaat verwijderen"
            @click="emit('remove', s.id)"
          />
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-1 text-muted">
        <CountryLabel
          :code="s.result.countryCode"
          :location="s.result.location"
        />
        <span>{{ s.result.sourceName }}</span>
        <span v-if="s.result.seller">· {{ s.result.seller.name }} · {{ s.result.seller.contact }}</span>
        <span>· opgeslagen door {{ s.savedBy }}</span>
      </div>

      <div>
        <p class="font-semibold">
          Contactlog
        </p>
        <p
          v-if="!s.contacts.length"
          class="text-muted"
        >
          Nog geen contact vastgelegd.
        </p>
        <ul
          v-else
          class="space-y-1"
        >
          <li
            v-for="c in s.contacts"
            :key="c.id"
          >
            <UBadge
              :label="OUTCOME_LABELS[c.outcome]"
              color="neutral"
              variant="subtle"
            />
            {{ c.note }}
            <span class="text-muted">· {{ c.by }}, {{ new Date(c.at).toLocaleString() }}</span>
          </li>
        </ul>
      </div>

      <form
        class="flex flex-wrap gap-2"
        @submit.prevent="add(s.id)"
      >
        <USelect
          v-model="draft(s.id).outcome"
          :items="CONTACT_OUTCOMES.map(o => ({ label: OUTCOME_LABELS[o], value: o }))"
          class="w-48"
        />
        <UInput
          v-model="draft(s.id).note"
          placeholder="Notitie, bijvoorbeeld: prijs 120 euro, levering in 2 weken"
          class="flex-1 min-w-48"
        />
        <UButton
          type="submit"
          label="Vastleggen"
          color="neutral"
          variant="subtle"
        />
      </form>
    </div>
  </div>
</template>

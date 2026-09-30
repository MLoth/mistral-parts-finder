<script setup lang="ts">
import type { SourceRating } from '#shared/types/ratings'

definePageMeta({ middleware: 'admin' })

const api = useApi()
const toast = useToast()
const { data: sources, refresh } = await useAsyncData('admin-source-ratings', () => api<SourceRating[]>('/api/admin/source-ratings'), { server: false })

const open = ref<string | null>(null)

async function run(fn: () => Promise<unknown>) {
  try {
    await fn()
    await refresh()
  } catch {
    toast.add({ title: 'Opslaan mislukt', color: 'error' })
  }
}

const setBlacklisted = (s: SourceRating, blacklisted: boolean) =>
  run(() => api(`/api/admin/source-ratings/${s.id}`, { method: 'PATCH', body: { blacklisted } }))

const removeRating = (s: SourceRating, ratingId: string) =>
  run(() => api(`/api/admin/source-ratings/${s.id}/ratings/${ratingId}`, { method: 'DELETE' }))

const renaming = reactive<Record<string, string>>({})
const rename = (s: SourceRating) =>
  run(async () => {
    await api(`/api/admin/source-ratings/${s.id}`, { method: 'PATCH', body: { label: renaming[s.id] } })
    renaming[s.id] = ''
  })
</script>

<template>
  <UContainer class="py-8 max-w-3xl space-y-6">
    <h1 class="text-2xl">
      Bronscores
    </h1>
    <p class="text-muted">
      Winkels, marktplaatsen en verkopers die collega's hebben beoordeeld. De score telt mee in de volgorde van de resultaten. Geblokkeerde bronnen verschijnen niet meer in de resultaten.
    </p>

    <UEmpty
      v-if="sources && !sources.length"
      icon="i-lucide-star"
      title="Nog geen beoordeelde bronnen"
      description="Beoordeel een bron vanuit een opgeslagen resultaat."
    />

    <UPageCard
      v-for="s in sources"
      :key="s.id"
    >
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <p class="font-semibold">
              {{ s.label }}
            </p>
            <UBadge
              :label="`${s.score}%`"
              :color="s.score >= 70 ? 'success' : s.score >= 40 ? 'neutral' : 'error'"
              variant="subtle"
            />
            <span class="text-sm text-muted">{{ s.good }}× goed · {{ s.bad }}× slecht</span>
          </div>
          <USwitch
            :model-value="s.blacklisted"
            label="Blokkeren"
            @update:model-value="setBlacklisted(s, $event)"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <UInput
            v-model="renaming[s.id]"
            :placeholder="`Naam wijzigen (nu: ${s.label})`"
            size="sm"
            class="w-64"
          />
          <UButton
            v-if="renaming[s.id]"
            label="Opslaan"
            size="sm"
            color="neutral"
            variant="subtle"
            @click="rename(s)"
          />
          <UButton
            :label="open === s.id ? 'Verberg geschiedenis' : `Geschiedenis (${s.ratings.length})`"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="open = open === s.id ? null : s.id"
          />
        </div>

        <ul
          v-if="open === s.id"
          class="space-y-2 text-sm"
        >
          <li
            v-for="r in [...s.ratings].reverse()"
            :key="r.id"
            class="flex items-start justify-between gap-2 rounded-md border border-default p-2"
          >
            <div>
              <UBadge
                :label="r.verdict === 'good' ? 'Goed' : 'Slecht'"
                :color="r.verdict === 'good' ? 'success' : 'error'"
                variant="subtle"
              />
              <span
                v-for="reason in r.reasons"
                :key="reason"
                class="ms-1 text-muted"
              >{{ REASON_LABELS[reason] }}</span>
              <p v-if="r.note">
                {{ r.note }}
              </p>
              <p class="text-muted">
                {{ r.by }} · {{ r.context }} · {{ new Date(r.at).toLocaleDateString() }}
              </p>
            </div>
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              variant="ghost"
              aria-label="Beoordeling verwijderen"
              @click="removeRating(s, r.id)"
            />
          </li>
        </ul>
      </div>
    </UPageCard>
  </UContainer>
</template>

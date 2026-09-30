<script setup lang="ts">
import type { Part, Project } from '#shared/types/project'
import type { PartSearch } from '#shared/types/search'
import type { ContactOutcome, SavedResult } from '#shared/types/saved'
import type { SourceResult } from '#shared/types/sourcing'
import type { RatingReason, Verdict } from '#shared/types/ratings'

const route = useRoute()
const api = useApi()
const toast = useToast()
const projectId = route.params.id as string
const partId = route.params.partId as string

const { data: projectData } = await useAsyncData(
  `project-${projectId}`,
  () => api<{ project: Project, parts: Part[] }>(`/api/projects/${projectId}`),
  { server: false }
)
const project = computed(() => projectData.value?.project)
const part = computed(() => projectData.value?.parts.find(p => p.id === partId))

const base = `/api/projects/${projectId}/parts/${partId}/searches`
const savedBase = `/api/projects/${projectId}/parts/${partId}/saved`

const { data: searches, refresh } = await useAsyncData(`searches-${partId}`, () => api<PartSearch[]>(base), { server: false })
const { data: saved, refresh: refreshSaved } = await useAsyncData(`saved-${partId}`, () => api<SavedResult[]>(savedBase), { server: false })
const savedIds = computed(() => (saved.value ?? []).map(s => s.id))

// Which search is shown, and whether the "new search" form is open
const activeId = ref<string | null>(null)
const creating = ref(false)
const active = computed(() => searches.value?.find(s => s.id === activeId.value) ?? searches.value?.[0])
const showForm = computed(() => creating.value || (!!searches.value && !searches.value.length))

const tab = ref('search')
const tabs = computed(() => [
  { label: 'Zoeken', value: 'search', icon: 'i-lucide-search', slot: 'search' as const },
  { label: `Opgeslagen (${saved.value?.length ?? 0})`, value: 'saved', icon: 'i-lucide-bookmark', slot: 'saved' as const }
])

async function onCreated(search: PartSearch) {
  await refresh()
  activeId.value = search.id
  creating.value = false
}

const searchLabel = (s: PartSearch, i: number) =>
  `${(searches.value?.length ?? 0) - i}. ${new Date(s.createdAt).toLocaleDateString()}`

async function saveResult(result: SourceResult) {
  try {
    await api(savedBase, { method: 'POST', body: { searchId: active.value!.id, resultId: result.id } })
    toast.add({ title: 'Resultaat opgeslagen', description: 'Te vinden onder het tabblad Opgeslagen.' })
    await refreshSaved()
  } catch (error) {
    toast.add({ title: 'Opslaan mislukt', description: apiError(error), color: 'error' })
  }
}

async function removeSaved(id: string) {
  await api(`${savedBase}/${id}`, { method: 'DELETE' })
  await refreshSaved()
}

async function addContact(id: string, entry: { note: string, outcome: ContactOutcome }) {
  try {
    await api(`${savedBase}/${id}/contacts`, { method: 'POST', body: entry })
    await refreshSaved()
  } catch (error) {
    toast.add({ title: 'Vastleggen mislukt', description: apiError(error), color: 'error' })
  }
}

async function rateSource(id: string, rating: { verdict: Verdict, reasons: RatingReason[], note: string }) {
  try {
    await api(`${savedBase}/${id}/rating`, { method: 'POST', body: rating })
    toast.add({ title: 'Beoordeling opgeslagen', description: 'Bij de volgende zoekopdracht telt deze bron mee in de volgorde.' })
    await refreshSaved()
  } catch (error) {
    toast.add({ title: 'Beoordelen mislukt', description: apiError(error), color: 'error' })
  }
}

async function adoptPartNumber(number: string) {
  try {
    await api(`/api/projects/${projectId}/parts/${partId}`, { method: 'PATCH', body: { partNumber: number } })
    toast.add({ title: 'Onderdeelnummer overgenomen' })
    projectData.value = await api(`/api/projects/${projectId}`)
  } catch (error) {
    toast.add({ title: 'Overnemen mislukt', description: apiError(error), color: 'error' })
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-4xl space-y-6">
    <UBreadcrumb
      :items="[
        { label: 'Projecten', to: '/' },
        { label: project?.name ?? '…', to: `/projects/${projectId}` },
        { label: part?.name ?? '…' }
      ]"
    />

    <header
      v-if="part"
      class="flex flex-wrap items-start justify-between gap-3"
    >
      <div class="space-y-1">
        <h1 class="text-2xl">
          {{ part.name }}
        </h1>
        <p class="text-muted">
          {{ project ? carLabel(project) : '' }}
          <template v-if="part.partNumber">
            · nr. {{ part.partNumber }}
          </template>
          · aantal {{ part.quantity }}
        </p>
      </div>
      <UBadge
        :label="STATUS_LABELS[part.status]"
        :color="STATUS_COLORS[part.status]"
        variant="subtle"
        size="lg"
      />
    </header>

    <UTabs
      v-model="tab"
      :items="tabs"
      :content="true"
      variant="link"
    >
      <template #search>
        <div class="space-y-8 pt-6">
          <NewSearchForm
            v-if="showForm"
            :base="base"
            @created="onCreated"
            @cancel="creating = false"
          />

          <template v-if="searches?.length">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm text-muted">Zoekopdracht</span>
                <UButton
                  v-for="(s, i) in searches"
                  :key="s.id"
                  :label="searchLabel(s, i)"
                  size="xs"
                  :color="s.id === active?.id ? 'primary' : 'neutral'"
                  :variant="s.id === active?.id ? 'solid' : 'subtle'"
                  @click="activeId = s.id; creating = false"
                />
              </div>
              <UButton
                v-if="!showForm"
                label="Nieuwe zoekopdracht"
                icon="i-lucide-plus"
                color="neutral"
                variant="subtle"
                @click="creating = true"
              />
            </div>

            <SearchPanel
              v-if="active && !showForm"
              :key="active.id"
              :base="base"
              :search="active"
              :saved-ids="savedIds"
              @changed="refresh()"
              @save="saveResult"
              @adopt="adoptPartNumber"
            />
          </template>
        </div>
      </template>

      <template #saved>
        <div class="pt-6">
          <SavedResults
            v-if="saved?.length"
            :saved="saved"
            @remove="removeSaved"
            @contact="addContact"
            @rate="rateSource"
          />
          <UEmpty
            v-else
            icon="i-lucide-bookmark"
            title="Nog niets opgeslagen"
            description="Sla een resultaat op bij het zoeken. Hier kun je daarna contact vastleggen en de bron beoordelen."
            :actions="[{ label: 'Naar zoeken', onClick: () => (tab = 'search') }]"
          />
        </div>
      </template>
    </UTabs>
  </UContainer>
</template>

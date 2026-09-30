<script setup lang="ts">
import type { Part, Project } from '#shared/types/project'
import type { PartSearch } from '#shared/types/search'

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

const { data: searches, refresh } = await useAsyncData(
  `searches-${partId}`,
  () => api<PartSearch[]>(`/api/projects/${projectId}/parts/${partId}/searches`),
  { server: false }
)

const base = `/api/projects/${projectId}/parts/${partId}/searches`

// New search
const form = reactive({ description: '', partNumber: '', info: '' })
const newImages = ref<UploadImage[]>([])
const searching = ref(false)

const strip = (images: UploadImage[]) => images.map(({ mediaType, base64 }) => ({ mediaType, base64 }))

function errorMessage(error: unknown) {
  return (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    ?? (error as { statusMessage?: string })?.statusMessage
    ?? 'Er ging iets mis'
}

async function startSearch() {
  searching.value = true
  try {
    await api(base, { method: 'POST', body: { ...form, images: strip(newImages.value) } })
    Object.assign(form, { description: '', partNumber: '', info: '' })
    newImages.value = []
    await refresh()
  } catch (error) {
    toast.add({ title: 'Zoeken mislukt', description: errorMessage(error), color: 'error' })
  } finally {
    searching.value = false
  }
}

// Refining an existing search
const answers = reactive<Record<string, string>>({})
const answerImages = reactive<Record<string, UploadImage[]>>({})
const refining = ref<string | null>(null)

async function refine(search: PartSearch) {
  refining.value = search.id
  try {
    await api(`${base}/${search.id}/refine`, {
      method: 'POST',
      body: { answer: answers[search.id] ?? '', images: strip(answerImages[search.id] ?? []) }
    })
    answers[search.id] = ''
    answerImages[search.id] = []
    await refresh()
  } catch (error) {
    toast.add({ title: 'Verfijnen mislukt', description: errorMessage(error), color: 'error' })
  } finally {
    refining.value = null
  }
}

const adopting = ref(false)
async function adoptPartNumber(number: string) {
  adopting.value = true
  try {
    await api(`/api/projects/${projectId}/parts/${partId}`, { method: 'PATCH', body: { partNumber: number } })
    toast.add({ title: 'Onderdeelnummer overgenomen' })
    projectData.value = await api(`/api/projects/${projectId}`)
  } finally {
    adopting.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-3xl space-y-6">
    <UButton
      :to="`/projects/${projectId}`"
      :label="project?.name ?? 'Project'"
      icon="i-lucide-arrow-left"
      color="neutral"
      variant="link"
      class="px-0"
    />

    <div v-if="part">
      <h1 class="text-2xl">
        Zoeken: {{ part.name }}
      </h1>
      <p class="text-muted">
        {{ project ? carLabel(project) : '' }}
        <template v-if="part.partNumber">
          · nr. {{ part.partNumber }}
        </template>
      </p>
    </div>

    <UPageCard
      title="Nieuwe zoekopdracht"
      description="Beschrijf het onderdeel zo goed als je kunt, ook als je het niet precies weet. Foto's helpen."
    >
      <form
        class="space-y-4"
        @submit.prevent="startSearch"
      >
        <UFormField label="Beschrijving">
          <UTextarea
            v-model="form.description"
            placeholder="Bijvoorbeeld: klein chromen dingetje boven de linker koplamp"
            class="w-full"
          />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Onderdeelnummer">
            <UInput
              v-model="form.partNumber"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Extra informatie">
            <UInput
              v-model="form.info"
              placeholder="Afmetingen, materiaal, positie…"
              class="w-full"
            />
          </UFormField>
        </div>
        <ImagePicker v-model="newImages" />
        <UButton
          type="submit"
          label="Zoeken"
          icon="i-lucide-search"
          :loading="searching"
        />
      </form>
    </UPageCard>

    <UAlert
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      description="De AI bepaalt hier welk onderdeel het is en welke zoektermen werken. Zoeken in webshops en bij verkopers is nog niet gekoppeld."
    />

    <section
      v-for="search in searches"
      :key="search.id"
      class="space-y-4"
    >
      <p class="text-sm text-muted">
        {{ new Date(search.createdAt).toLocaleString() }} · {{ search.createdByName }}
      </p>

      <template
        v-for="(turn, i) in search.turns"
        :key="i"
      >
        <div
          v-if="turn.userText || turn.imageCount"
          class="ms-8 rounded-md bg-elevated p-3 text-sm whitespace-pre-line"
        >
          {{ turn.userText }}
          <span
            v-if="turn.imageCount"
            class="block text-muted"
          >
            {{ turn.imageCount }} foto{{ turn.imageCount === 1 ? '' : "'s" }} meegestuurd
          </span>
        </div>
        <AnalysisCard :analysis="turn.analysis" />
      </template>

      <div
        v-if="search.turns.at(-1)!.analysis.possiblePartNumbers.length"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <span class="text-muted">Overnemen als onderdeelnummer:</span>
        <UButton
          v-for="n in search.turns.at(-1)!.analysis.possiblePartNumbers"
          :key="n"
          :label="n"
          size="xs"
          color="neutral"
          variant="subtle"
          :loading="adopting"
          @click="adoptPartNumber(n)"
        />
      </div>

      <form
        class="space-y-2"
        @submit.prevent="refine(search)"
      >
        <UTextarea
          v-model="answers[search.id]"
          placeholder="Antwoord op de vragen of geef meer informatie…"
          class="w-full"
        />
        <ImagePicker
          :model-value="answerImages[search.id] ?? []"
          @update:model-value="answerImages[search.id] = $event"
        />
        <UButton
          type="submit"
          label="Verfijnen"
          icon="i-lucide-sparkles"
          color="neutral"
          variant="subtle"
          :loading="refining === search.id"
        />
      </form>
      <USeparator />
    </section>

    <UEmpty
      v-if="searches && !searches.length"
      icon="i-lucide-search"
      title="Nog geen zoekopdrachten voor dit onderdeel"
    />
  </UContainer>
</template>

<script setup lang="ts">
import type { Project } from '#shared/types/project'

const api = useApi()
const mine = ref(useCookie<boolean>('pref-only-mine', { default: () => false }).value)
const creating = ref(false)

const { data: projects, status } = await useAsyncData(
  'projects',
  () => api<Project[]>('/api/projects', { query: { mine: mine.value } }),
  { server: false, watch: [mine] }
)

async function onCreated(project: Project) {
  await navigateTo(`/projects/${project.id}`)
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl">
        Projecten
      </h1>
      <div class="flex items-center gap-3">
        <USwitch
          v-model="mine"
          label="Alleen mijn projecten"
        />
        <UButton
          label="Nieuw project"
          icon="i-lucide-plus"
          @click="creating = true"
        />
      </div>
    </div>

    <div
      v-if="status === 'pending' && !projects"
      class="text-muted"
    >
      Laden…
    </div>

    <UEmpty
      v-else-if="!projects?.length"
      icon="i-lucide-car"
      :title="mine ? 'Je hebt nog geen projecten' : 'Nog geen projecten'"
      description="Maak een project aan voor een klassieker en noteer welke onderdelen je nodig hebt."
      :actions="[{ label: 'Nieuw project', icon: 'i-lucide-plus', onClick: () => (creating = true) }]"
    />

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <UPageCard
        v-for="project in projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        :title="projectTitle(project)"
        :description="project.name ? carLabel(project) : ''"
      >
        <div class="space-y-2">
          <UProgress
            :model-value="project.partsTotal ? (project.partsSourced / project.partsTotal) * 100 : 0"
            size="sm"
          />
          <p class="text-sm text-muted">
            {{ project.partsSourced }} van {{ project.partsTotal }} onderdelen gevonden
          </p>
        </div>
      </UPageCard>
    </div>

    <ProjectFormModal
      v-model:open="creating"
      @saved="onCreated"
    />
  </UContainer>
</template>

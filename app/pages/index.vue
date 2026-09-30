<script setup lang="ts">
import type { Project } from '#shared/types/project'

const api = useApi()
const mine = ref(false)
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
        Projects
      </h1>
      <div class="flex items-center gap-3">
        <USwitch
          v-model="mine"
          label="Only mine"
        />
        <UButton
          label="New project"
          icon="i-lucide-plus"
          @click="creating = true"
        />
      </div>
    </div>

    <div
      v-if="status === 'pending' && !projects"
      class="text-muted"
    >
      Loading…
    </div>

    <UEmpty
      v-else-if="!projects?.length"
      icon="i-lucide-car"
      :title="mine ? 'You have no projects yet' : 'No projects yet'"
      description="Create a project for a classic car to start listing the parts you need."
      :actions="[{ label: 'New project', icon: 'i-lucide-plus', onClick: () => (creating = true) }]"
    />

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <UPageCard
        v-for="project in projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        :title="project.name"
        :description="carLabel(project) || 'No car details'"
      >
        <div class="space-y-2">
          <UProgress
            :model-value="project.partsTotal ? (project.partsSourced / project.partsTotal) * 100 : 0"
            size="sm"
          />
          <p class="text-sm text-muted">
            {{ project.partsSourced }} of {{ project.partsTotal }} parts sourced
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

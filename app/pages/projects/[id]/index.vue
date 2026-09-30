<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Part, PartStatus, Project } from '#shared/types/project'
import { PART_STATUSES } from '#shared/types/project'

const route = useRoute()
const api = useApi()
const toast = useToast()
const { user, isAdmin } = useAuth()
const id = route.params.id as string

const { data, refresh, error } = await useAsyncData(
  `project-${id}`,
  () => api<{ project: Project, parts: Part[] }>(`/api/projects/${id}`),
  { server: false }
)

const project = computed(() => data.value?.project)
const parts = computed(() => data.value?.parts ?? [])
const canDelete = computed(() => isAdmin.value || project.value?.createdBy === user.value?.uid)

const editing = ref(false)
const adding = ref(false)
const confirmDelete = ref(false)

const columns: TableColumn<Part>[] = [
  { accessorKey: 'name', header: 'Onderdeel' },
  { accessorKey: 'quantity', header: 'Aantal' },
  { accessorKey: 'partNumber', header: 'Onderdeelnummer' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: '' }
]

async function run(fn: () => Promise<unknown>, failure: string) {
  try {
    await fn()
    await refresh()
  } catch {
    toast.add({ title: failure, color: 'error' })
  }
}

const setStatus = (part: Part, status: PartStatus) =>
  run(() => api(`/api/projects/${id}/parts/${part.id}`, { method: 'PATCH', body: { status } }), 'Onderdeel bijwerken mislukt')

const removePart = (part: Part) =>
  run(() => api(`/api/projects/${id}/parts/${part.id}`, { method: 'DELETE' }), 'Onderdeel verwijderen mislukt')

async function deleteProject() {
  try {
    await api(`/api/projects/${id}`, { method: 'DELETE' })
    await navigateTo('/')
  } catch {
    toast.add({ title: 'Project verwijderen mislukt', color: 'error' })
  }
}

const editingPart = ref<Part | null>(null)
const partForm = reactive({ name: '', quantity: 1, partNumber: '', notes: '' })

function editPart(part: Part) {
  editingPart.value = part
  Object.assign(partForm, { name: part.name, quantity: part.quantity, partNumber: part.partNumber, notes: part.notes })
}

async function savePart() {
  const part = editingPart.value!
  await run(() => api(`/api/projects/${id}/parts/${part.id}`, { method: 'PATCH', body: partForm }), 'Onderdeel bijwerken mislukt')
  editingPart.value = null
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <UButton
      to="/"
      label="Alle projecten"
      icon="i-lucide-arrow-left"
      color="neutral"
      variant="link"
      class="px-0"
    />

    <UAlert
      v-if="error"
      color="error"
      title="Project niet gevonden"
    />

    <template v-else-if="project">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl">
            {{ project.name }}
          </h1>
          <p class="text-muted">
            {{ carLabel(project) || 'Geen autogegevens' }} · aangemaakt door {{ project.createdByName || project.createdByEmail }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            label="Bewerken"
            icon="i-lucide-pencil"
            color="neutral"
            variant="subtle"
            @click="editing = true"
          />
          <UButton
            v-if="canDelete"
            label="Verwijderen"
            icon="i-lucide-trash-2"
            color="error"
            variant="subtle"
            @click="confirmDelete = true"
          />
        </div>
      </div>

      <p
        v-if="project.notes"
        class="whitespace-pre-line"
      >
        {{ project.notes }}
      </p>

      <div class="space-y-2">
        <UProgress
          :model-value="project.partsTotal ? (project.partsSourced / project.partsTotal) * 100 : 0"
        />
        <p class="text-sm text-muted">
          {{ project.partsSourced }} van {{ project.partsTotal }} onderdelen gevonden
        </p>
      </div>

      <div class="flex items-center justify-between">
        <h2 class="text-lg">
          Onderdelen
        </h2>
        <UButton
          label="Onderdelen toevoegen"
          icon="i-lucide-plus"
          @click="adding = true"
        />
      </div>

      <UEmpty
        v-if="!parts.length"
        icon="i-lucide-cog"
        title="Nog geen onderdelen"
        description="Voeg de onderdelen toe die deze auto nodig heeft."
        :actions="[{ label: 'Onderdelen toevoegen', icon: 'i-lucide-plus', onClick: () => (adding = true) }]"
      />
      <UTable
        v-else
        :data="parts"
        :columns="columns"
      >
        <template #status-cell="{ row }">
          <USelect
            :model-value="row.original.status"
            :items="PART_STATUSES.map(s => ({ label: STATUS_LABELS[s], value: s }))"
            :color="STATUS_COLORS[row.original.status]"
            class="w-36"
            @update:model-value="setStatus(row.original, $event as PartStatus)"
          />
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton
              :to="`/projects/${id}/parts/${row.original.id}`"
              icon="i-lucide-search"
              color="primary"
              variant="ghost"
              aria-label="Zoek dit onderdeel"
            />
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              aria-label="Onderdeel bewerken"
              @click="editPart(row.original)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              aria-label="Onderdeel verwijderen"
              @click="removePart(row.original)"
            />
          </div>
        </template>
      </UTable>

      <ProjectFormModal
        v-model:open="editing"
        :project="project"
        @saved="() => refresh()"
      />
      <PartsAddModal
        v-model:open="adding"
        :project-id="id"
        @saved="() => refresh()"
      />

      <UModal
        v-model:open="confirmDelete"
        title="Project verwijderen?"
        :description="`“${project.name}” en de ${project.partsTotal} onderdelen worden definitief verwijderd.`"
      >
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton
              label="Annuleren"
              color="neutral"
              variant="ghost"
              @click="confirmDelete = false"
            />
            <UButton
              label="Verwijderen"
              color="error"
              @click="deleteProject"
            />
          </div>
        </template>
      </UModal>

      <UModal
        :open="!!editingPart"
        title="Onderdeel bewerken"
        @update:open="editingPart = null"
      >
        <template #body>
          <form
            class="space-y-4"
            @submit.prevent="savePart"
          >
            <UFormField
              label="Naam"
              required
            >
              <UInput
                v-model="partForm.name"
                required
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Aantal">
                <UInputNumber
                  v-model="partForm.quantity"
                  :min="1"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Onderdeelnummer">
                <UInput
                  v-model="partForm.partNumber"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Notities">
              <UTextarea
                v-model="partForm.notes"
                class="w-full"
              />
            </UFormField>
            <div class="flex justify-end">
              <UButton
                type="submit"
                label="Opslaan"
              />
            </div>
          </form>
        </template>
      </UModal>
    </template>
  </UContainer>
</template>

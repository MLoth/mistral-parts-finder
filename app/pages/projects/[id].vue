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
  { accessorKey: 'name', header: 'Part' },
  { accessorKey: 'quantity', header: 'Qty' },
  { accessorKey: 'partNumber', header: 'Part number' },
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
  run(() => api(`/api/projects/${id}/parts/${part.id}`, { method: 'PATCH', body: { status } }), 'Could not update part')

const removePart = (part: Part) =>
  run(() => api(`/api/projects/${id}/parts/${part.id}`, { method: 'DELETE' }), 'Could not remove part')

async function deleteProject() {
  try {
    await api(`/api/projects/${id}`, { method: 'DELETE' })
    await navigateTo('/')
  } catch {
    toast.add({ title: 'Could not delete project', color: 'error' })
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
  await run(() => api(`/api/projects/${id}/parts/${part.id}`, { method: 'PATCH', body: partForm }), 'Could not update part')
  editingPart.value = null
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <UButton
      to="/"
      label="All projects"
      icon="i-lucide-arrow-left"
      color="neutral"
      variant="link"
      class="px-0"
    />

    <UAlert
      v-if="error"
      color="error"
      title="Project not found"
    />

    <template v-else-if="project">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl">
            {{ project.name }}
          </h1>
          <p class="text-muted">
            {{ carLabel(project) || 'No car details' }} · created by {{ project.createdByName || project.createdByEmail }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            label="Edit"
            icon="i-lucide-pencil"
            color="neutral"
            variant="subtle"
            @click="editing = true"
          />
          <UButton
            v-if="canDelete"
            label="Delete"
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
          {{ project.partsSourced }} of {{ project.partsTotal }} parts sourced
        </p>
      </div>

      <div class="flex items-center justify-between">
        <h2 class="text-lg">
          Parts
        </h2>
        <UButton
          label="Add parts"
          icon="i-lucide-plus"
          @click="adding = true"
        />
      </div>

      <UEmpty
        v-if="!parts.length"
        icon="i-lucide-cog"
        title="No parts yet"
        description="Add the parts this car needs."
        :actions="[{ label: 'Add parts', icon: 'i-lucide-plus', onClick: () => (adding = true) }]"
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
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              aria-label="Edit part"
              @click="editPart(row.original)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              aria-label="Remove part"
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
        title="Delete project?"
        :description="`“${project.name}” and its ${project.partsTotal} parts will be permanently deleted.`"
      >
        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="confirmDelete = false"
            />
            <UButton
              label="Delete"
              color="error"
              @click="deleteProject"
            />
          </div>
        </template>
      </UModal>

      <UModal
        :open="!!editingPart"
        title="Edit part"
        @update:open="editingPart = null"
      >
        <template #body>
          <form
            class="space-y-4"
            @submit.prevent="savePart"
          >
            <UFormField
              label="Name"
              required
            >
              <UInput
                v-model="partForm.name"
                required
                class="w-full"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Quantity">
                <UInputNumber
                  v-model="partForm.quantity"
                  :min="1"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Part number">
                <UInput
                  v-model="partForm.partNumber"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Notes">
              <UTextarea
                v-model="partForm.notes"
                class="w-full"
              />
            </UFormField>
            <div class="flex justify-end">
              <UButton
                type="submit"
                label="Save"
              />
            </div>
          </form>
        </template>
      </UModal>
    </template>
  </UContainer>
</template>

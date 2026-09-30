<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Project } from '#shared/types/project'

const props = defineProps<{ project?: Project }>()
const emit = defineEmits<{ saved: [project: Project] }>()
const open = defineModel<boolean>('open', { default: false })

const api = useApi()
const toast = useToast()
const saving = ref(false)

const state = reactive<Partial<ProjectInput>>({})

watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(state, {
    name: props.project?.name ?? '',
    make: props.project?.make ?? '',
    model: props.project?.model ?? '',
    year: props.project?.year ?? null,
    notes: props.project?.notes ?? ''
  })
})

async function onSubmit(event: FormSubmitEvent<ProjectInput>) {
  saving.value = true
  try {
    const saved = props.project
      ? await api<Project>(`/api/projects/${props.project.id}`, { method: 'PATCH', body: event.data })
      : await api<Project>('/api/projects', { method: 'POST', body: event.data })
    open.value = false
    emit('saved', saved)
  } catch {
    toast.add({ title: 'Project opslaan mislukt', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="project ? 'Project bewerken' : 'Nieuw project'"
  >
    <template #body>
      <UForm
        :schema="projectSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Naam"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="E-Type restauratie"
            class="w-full"
          />
        </UFormField>
        <div class="grid grid-cols-3 gap-3">
          <UFormField
            label="Merk"
            name="make"
          >
            <UInput
              v-model="state.make"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Model"
            name="model"
          >
            <UInput
              v-model="state.model"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Bouwjaar"
            name="year"
          >
            <UInputNumber
              v-model="state.year"
              :increment="false"
              :decrement="false"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField
          label="Notities"
          name="notes"
        >
          <UTextarea
            v-model="state.notes"
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            label="Annuleren"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            type="submit"
            :label="project ? 'Opslaan' : 'Project aanmaken'"
            :loading="saving"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

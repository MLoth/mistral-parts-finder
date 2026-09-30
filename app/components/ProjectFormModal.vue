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
    toast.add({ title: 'Could not save project', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="project ? 'Edit project' : 'New project'"
  >
    <template #body>
      <UForm
        :schema="projectSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="E-Type restoration"
            class="w-full"
          />
        </UFormField>
        <div class="grid grid-cols-3 gap-3">
          <UFormField
            label="Make"
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
            label="Year"
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
          label="Notes"
          name="notes"
        >
          <UTextarea
            v-model="state.notes"
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            type="submit"
            :label="project ? 'Save' : 'Create project'"
            :loading="saving"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

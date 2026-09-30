<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Project } from '#shared/types/project'

const props = defineProps<{ project?: Project }>()
const emit = defineEmits<{ saved: [project: Project] }>()
const open = defineModel<boolean>('open', { default: false })

const api = useApi()
const toast = useToast()
const saving = ref(false)

const { data: catalog } = await useCatalog()
// Brands and types typed in this form that are not in the catalogue yet; the server adds them when saving
const newBrands = ref<string[]>([])
const newModels = ref<string[]>([])
const norm = (v: string | undefined) => (v ?? '').trim().toLowerCase()

const brandItems = computed(() => [...(catalog.value ?? []).map(b => b.name), ...newBrands.value])
const modelItems = computed(() => {
  const brand = catalog.value?.find(b => norm(b.name) === norm(state.make))
  return [...(brand?.models ?? []), ...newModels.value]
})

const state = reactive<Partial<ProjectInput>>({ name: '', make: '', model: '', year: null, notes: '' })

// True while the form is being filled from a project, so that fill does not count as the user changing the brand
let filling = false

watch(open, async (isOpen) => {
  if (!isOpen) return
  filling = true
  newBrands.value = []
  newModels.value = []
  Object.assign(state, {
    name: props.project?.name ?? '',
    make: props.project?.make ?? '',
    model: props.project?.model ?? '',
    year: props.project?.year ?? null,
    notes: props.project?.notes ?? ''
  })
  await nextTick()
  filling = false
})

// A type belongs to a brand, so clear it when the user picks a different brand
watch(() => state.make, (now, before) => {
  if (!filling && norm(now) !== norm(before)) state.model = ''
})

async function onSubmit(event: FormSubmitEvent<ProjectInput>) {
  saving.value = true
  try {
    const saved = props.project
      ? await api<Project>(`/api/projects/${props.project.id}`, { method: 'PATCH', body: event.data })
      : await api<Project>('/api/projects', { method: 'POST', body: event.data })
    open.value = false
    refreshNuxtData('catalog')
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
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField
            label="Merk"
            name="make"
            required
          >
            <UInputMenu
              v-model="state.make"
              :items="brandItems"
              create-item
              open-on-click
              open-on-focus
              placeholder="Typ om te zoeken of toe te voegen"
              class="w-full"
              @create="(item: string) => { newBrands.push(item); state.make = item }"
            />
          </UFormField>
          <UFormField
            label="Type"
            name="model"
            required
          >
            <UInputMenu
              v-model="state.model"
              :items="modelItems"
              create-item
              open-on-click
              open-on-focus
              :disabled="!state.make"
              :placeholder="state.make ? 'Typ om te zoeken of toe te voegen' : 'Kies eerst een merk'"
              class="w-full"
              @create="(item: string) => { newModels.push(item); state.model = item }"
            />
          </UFormField>
        </div>
        <UFormField
          label="Bouwjaar"
          name="year"
        >
          <UInputNumber
            v-model="state.year"
            :increment="false"
            :decrement="false"
            class="w-full sm:w-1/2"
          />
        </UFormField>
        <UFormField
          label="Naam (optioneel)"
          name="name"
          help="Bijvoorbeeld de naam van de klant of de auto. Anders tonen we merk en type."
        >
          <UInput
            v-model="state.name"
            class="w-full"
          />
        </UFormField>
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

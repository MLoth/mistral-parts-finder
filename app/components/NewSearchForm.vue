<script setup lang="ts">
import type { PartSearch } from '#shared/types/search'

const props = defineProps<{ base: string }>()
const emit = defineEmits<{ created: [search: PartSearch], cancel: [] }>()

const api = useApi()
const toast = useToast()
const form = reactive({ description: '', partNumber: '', info: '' })
const images = ref<UploadImage[]>([])
const busy = ref(false)

async function submit() {
  busy.value = true
  try {
    const search = await api<PartSearch>(props.base, {
      method: 'POST',
      body: { ...form, images: images.value.map(({ mediaType, base64 }) => ({ mediaType, base64 })) }
    })
    Object.assign(form, { description: '', partNumber: '', info: '' })
    images.value = []
    emit('created', search)
  } catch (error) {
    toast.add({ title: 'Zoeken mislukt', description: apiError(error), color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Wat zoek je?"
    description="Beschrijf het onderdeel zo goed als je kunt, ook als je het niet precies weet. Foto's helpen enorm."
  >
    <form
      class="space-y-4"
      @submit.prevent="submit"
    >
      <UFormField
        label="Beschrijving"
        help="Bijvoorbeeld: klein chromen dingetje boven de linker koplamp"
      >
        <UTextarea
          v-model="form.description"
          :rows="3"
          class="w-full"
        />
      </UFormField>
      <ImagePicker v-model="images" />
      <details class="text-sm">
        <summary class="cursor-pointer text-muted">
          Weet je meer? Onderdeelnummer of extra informatie
        </summary>
        <div class="mt-3 grid gap-4 sm:grid-cols-2">
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
      </details>
      <div class="flex gap-2">
        <UButton
          type="submit"
          label="Onderdeel herkennen"
          icon="i-lucide-sparkles"
          :loading="busy"
        />
        <UButton
          label="Annuleren"
          color="neutral"
          variant="ghost"
          @click="emit('cancel')"
        />
      </div>
    </form>
  </UPageCard>
</template>

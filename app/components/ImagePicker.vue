<script setup lang="ts">
const images = defineModel<UploadImage[]>({ default: () => [] })
const max = 4
const toast = useToast()
const input = ref<HTMLInputElement>()
const busy = ref(false)

async function onPick(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  ;(event.target as HTMLInputElement).value = ''
  busy.value = true
  try {
    for (const file of files.slice(0, max - images.value.length)) {
      if (!file.type.startsWith('image/')) continue
      images.value = [...images.value, await prepareImage(file)]
    }
  } catch {
    toast.add({ title: 'Foto laden mislukt', color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="images.length"
      class="flex flex-wrap gap-2"
    >
      <div
        v-for="(image, i) in images"
        :key="i"
        class="relative"
      >
        <img
          :src="image.preview"
          alt="Bijgevoegde foto"
          class="size-20 rounded-md object-cover"
        >
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          class="absolute -top-2 -right-2 rounded-full"
          aria-label="Foto verwijderen"
          @click="images = images.filter((_, n) => n !== i)"
        />
      </div>
    </div>
    <input
      ref="input"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="onPick"
    >
    <UButton
      v-if="images.length < max"
      label="Foto toevoegen"
      icon="i-lucide-camera"
      color="neutral"
      variant="subtle"
      :loading="busy"
      @click="input?.click()"
    />
  </div>
</template>

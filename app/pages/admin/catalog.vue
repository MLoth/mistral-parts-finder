<script setup lang="ts">
import type { CatalogBrand } from '~/composables/useCatalog'

definePageMeta({ middleware: 'admin' })

const api = useApi()
const toast = useToast()

const { data: loaded } = await useCatalog()
// Work on a copy and only save when the admin presses Opslaan
const brands = ref<CatalogBrand[]>([])
const saved = ref('')
watch(loaded, (value) => {
  brands.value = JSON.parse(JSON.stringify(value ?? []))
  saved.value = JSON.stringify(brands.value)
}, { immediate: true })

const dirty = computed(() => JSON.stringify(brands.value) !== saved.value)
const selected = ref<string | null>(null)
const brand = computed(() => brands.value.find(b => b.name === selected.value))
watch(brands, (list) => {
  if (!selected.value || !list.some(b => b.name === selected.value)) selected.value = list[0]?.name ?? null
}, { immediate: true })

const filter = ref('')
const shown = computed(() => brands.value.filter(b => b.name.toLowerCase().includes(filter.value.toLowerCase())))
const norm = (s: string) => s.trim().toLowerCase()

const newBrand = ref('')
function addBrand() {
  const name = newBrand.value.trim()
  if (!name) return
  if (brands.value.some(b => norm(b.name) === norm(name))) {
    toast.add({ title: 'Dit merk bestaat al', color: 'warning' })
    return
  }
  brands.value = [...brands.value, { name, models: [] }].sort((a, b) => a.name.localeCompare(b.name))
  selected.value = name
  newBrand.value = ''
}

function removeBrand() {
  brands.value = brands.value.filter(b => b.name !== selected.value)
}

const renaming = ref('')
watch(selected, name => (renaming.value = name ?? ''), { immediate: true })
function renameBrand() {
  const name = renaming.value.trim()
  if (!brand.value || !name || name === brand.value.name) return
  if (brands.value.some(b => b !== brand.value && norm(b.name) === norm(name))) {
    toast.add({ title: 'Dit merk bestaat al', color: 'warning' })
    return
  }
  brand.value.name = name
  selected.value = name
}

const newModel = ref('')
function addModel() {
  const name = newModel.value.trim()
  if (!name || !brand.value) return
  if (!brand.value.models.some(m => norm(m) === norm(name))) brand.value.models = [...brand.value.models, name]
  newModel.value = ''
}

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    const result = await api<CatalogBrand[]>('/api/admin/catalog', { method: 'PUT', body: { brands: brands.value } })
    loaded.value = result
    toast.add({ title: 'Merken en types opgeslagen' })
  } catch (error) {
    toast.add({ title: 'Opslaan mislukt', description: apiError(error), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl">
          Merken en types
        </h1>
        <p class="text-muted">
          De lijst die medewerkers zien bij het aanmaken van een project. Bestaande projecten behouden hun tekst als je hier iets hernoemt of verwijdert.
        </p>
      </div>
      <UButton
        label="Opslaan"
        icon="i-lucide-save"
        :disabled="!dirty"
        :loading="saving"
        @click="save"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <UCard>
        <div class="space-y-3">
          <UInput
            v-model="filter"
            icon="i-lucide-search"
            placeholder="Merk zoeken"
            class="w-full"
          />
          <ul class="max-h-96 space-y-1 overflow-y-auto">
            <li
              v-for="b in shown"
              :key="b.name"
            >
              <UButton
                :label="b.name"
                block
                :color="b.name === selected ? 'primary' : 'neutral'"
                :variant="b.name === selected ? 'subtle' : 'ghost'"
                class="justify-between"
                @click="selected = b.name"
              >
                <template #trailing>
                  <span class="text-xs text-muted">{{ b.models.length }}</span>
                </template>
              </UButton>
            </li>
          </ul>
          <form
            class="flex gap-2"
            @submit.prevent="addBrand"
          >
            <UInput
              v-model="newBrand"
              placeholder="Nieuw merk"
              class="flex-1"
            />
            <UButton
              type="submit"
              icon="i-lucide-plus"
              aria-label="Merk toevoegen"
              color="neutral"
              variant="subtle"
            />
          </form>
        </div>
      </UCard>

      <UCard v-if="brand">
        <div class="space-y-4">
          <form
            class="flex flex-wrap gap-2"
            @submit.prevent="renameBrand"
          >
            <UInput
              v-model="renaming"
              class="w-64"
            />
            <UButton
              type="submit"
              label="Hernoemen"
              color="neutral"
              variant="subtle"
              :disabled="!renaming.trim() || renaming.trim() === brand.name"
            />
            <UButton
              label="Merk verwijderen"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              @click="removeBrand"
            />
          </form>

          <form
            class="flex gap-2"
            @submit.prevent="addModel"
          >
            <UInput
              v-model="newModel"
              :placeholder="`Nieuw type voor ${brand.name}`"
              class="flex-1"
            />
            <UButton
              type="submit"
              label="Toevoegen"
              icon="i-lucide-plus"
              color="neutral"
              variant="subtle"
            />
          </form>

          <p
            v-if="!brand.models.length"
            class="text-sm text-muted"
          >
            Nog geen types voor dit merk.
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="m in brand.models"
              :key="m"
              color="neutral"
              variant="subtle"
              size="lg"
              class="gap-1"
            >
              {{ m }}
              <UButton
                icon="i-lucide-x"
                size="xs"
                color="neutral"
                variant="link"
                :aria-label="`${m} verwijderen`"
                @click="brand.models = brand.models.filter(x => x !== m)"
              />
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

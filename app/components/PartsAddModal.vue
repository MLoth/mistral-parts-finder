<script setup lang="ts">
const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>('open', { default: false })

type Row = { name: string, quantity: number, partNumber: string, notes: string }
const blank = (): Row => ({ name: '', quantity: 1, partNumber: '', notes: '' })

const api = useApi()
const toast = useToast()
const rows = ref<Row[]>([blank()])
const saving = ref(false)

watch(open, (isOpen) => {
  if (isOpen) rows.value = [blank()]
})

async function save() {
  const filled = rows.value.filter(r => r.name.trim())
  if (!filled.length) {
    toast.add({ title: 'Enter at least one part name', color: 'warning' })
    return
  }
  saving.value = true
  try {
    await api(`/api/projects/${props.projectId}/parts`, { method: 'POST', body: filled })
    open.value = false
    emit('saved')
  } catch {
    toast.add({ title: 'Could not add parts', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Add parts"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #body>
      <form
        class="space-y-3"
        @submit.prevent="save"
      >
        <div
          v-for="(row, i) in rows"
          :key="i"
          class="grid grid-cols-12 gap-2 items-start"
        >
          <UInput
            v-model="row.name"
            placeholder="Part name"
            class="col-span-4"
            :autofocus="i === 0"
          />
          <UInputNumber
            v-model="row.quantity"
            :min="1"
            class="col-span-2"
          />
          <UInput
            v-model="row.partNumber"
            placeholder="Part number"
            class="col-span-3"
          />
          <UInput
            v-model="row.notes"
            placeholder="Notes"
            class="col-span-2"
          />
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            aria-label="Remove row"
            :disabled="rows.length === 1"
            @click="rows.splice(i, 1)"
          />
        </div>
        <UButton
          label="Add another"
          icon="i-lucide-plus"
          color="neutral"
          variant="subtle"
          @click="rows.push(blank())"
        />
        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            type="submit"
            label="Add parts"
            :loading="saving"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>

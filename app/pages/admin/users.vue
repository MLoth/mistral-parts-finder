<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ middleware: 'admin' })

type AdminUser = {
  uid: string
  email: string
  name: string
  role: 'admin' | 'staff'
  disabled: boolean
  lastSignIn: string | null
}

const api = useApi()
const toast = useToast()
const { user: me } = useAuth()

const { data: users, refresh, status } = await useAsyncData('admin-users', () => api<AdminUser[]>('/api/admin/users'), { server: false })

const columns: TableColumn<AdminUser>[] = [
  { accessorKey: 'name', header: 'Naam' },
  { accessorKey: 'email', header: 'E-mail' },
  { accessorKey: 'role', header: 'Rol' },
  { accessorKey: 'lastSignIn', header: 'Laatst ingelogd' },
  { id: 'actions', header: '' }
]

function errorMessage(error: unknown) {
  return (error as { statusMessage?: string })?.statusMessage ?? 'Er ging iets mis'
}

async function update(u: AdminUser, patch: Partial<Pick<AdminUser, 'role' | 'disabled'>>) {
  try {
    await api(`/api/admin/users/${u.uid}`, { method: 'PATCH', body: patch })
    await refresh()
  } catch (error) {
    toast.add({ title: 'Bijwerken mislukt', description: errorMessage(error), color: 'error' })
  }
}

const open = ref(false)
const form = reactive({ email: '', role: 'staff' as AdminUser['role'] })
const creating = ref(false)
const setPasswordLink = ref('')

async function create() {
  creating.value = true
  try {
    const result = await api<{ setPasswordLink: string }>('/api/admin/users', { method: 'POST', body: form })
    setPasswordLink.value = result.setPasswordLink
    await refresh()
  } catch (error) {
    toast.add({ title: 'Gebruiker aanmaken mislukt', description: errorMessage(error), color: 'error' })
  } finally {
    creating.value = false
  }
}

function close() {
  open.value = false
  setPasswordLink.value = ''
  form.email = ''
  form.role = 'staff'
}

async function copyLink() {
  await navigator.clipboard.writeText(setPasswordLink.value)
  toast.add({ title: 'Link gekopieerd' })
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl">
        Gebruikers
      </h1>
      <UButton
        label="Gebruiker toevoegen"
        icon="i-lucide-plus"
        @click="open = true"
      />
    </div>

    <UTable
      :data="users ?? []"
      :columns="columns"
      :loading="status === 'pending'"
    >
      <template #name-cell="{ row }">
        {{ row.original.name || '—' }}
      </template>
      <template #role-cell="{ row }">
        <USelect
          :model-value="row.original.role"
          :items="ROLE_ITEMS"
          :disabled="row.original.uid === me?.uid"
          class="w-28"
          @update:model-value="update(row.original, { role: $event as AdminUser['role'] })"
        />
      </template>
      <template #lastSignIn-cell="{ row }">
        {{ row.original.lastSignIn ? new Date(row.original.lastSignIn).toLocaleString() : 'Nooit' }}
      </template>
      <template #actions-cell="{ row }">
        <UButton
          v-if="row.original.uid !== me?.uid"
          :label="row.original.disabled ? 'Inschakelen' : 'Uitschakelen'"
          :color="row.original.disabled ? 'neutral' : 'error'"
          variant="ghost"
          size="sm"
          @click="update(row.original, { disabled: !row.original.disabled })"
        />
      </template>
    </UTable>

    <UModal
      v-model:open="open"
      title="Gebruiker toevoegen"
      @after-leave="close"
    >
      <template #body>
        <div
          v-if="setPasswordLink"
          class="space-y-3"
        >
          <p class="text-sm">
            Gebruiker aangemaakt. Stuur deze link door zodat de gebruiker een wachtwoord kan instellen. De link wordt maar één keer getoond.
          </p>
          <UInput
            :model-value="setPasswordLink"
            readonly
            class="w-full"
          />
          <UButton
            label="Link kopiëren"
            icon="i-lucide-copy"
            @click="copyLink"
          />
        </div>
        <form
          v-else
          class="space-y-4"
          @submit.prevent="create"
        >
          <UFormField
            label="E-mail"
            required
          >
            <UInput
              v-model="form.email"
              type="email"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField label="Rol">
            <USelect
              v-model="form.role"
              :items="ROLE_ITEMS"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            label="Gebruiker aanmaken"
            :loading="creating"
          />
        </form>
      </template>
    </UModal>
  </UContainer>
</template>

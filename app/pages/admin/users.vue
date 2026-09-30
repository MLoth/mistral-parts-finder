<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ middleware: 'admin' })

type AdminUser = {
  uid: string
  email: string
  role: 'admin' | 'staff'
  disabled: boolean
  lastSignIn: string | null
}

const api = useApi()
const toast = useToast()
const { user: me } = useAuth()

const { data: users, refresh, status } = await useAsyncData('admin-users', () => api<AdminUser[]>('/api/admin/users'), { server: false })

const columns: TableColumn<AdminUser>[] = [
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'lastSignIn', header: 'Last sign in' },
  { id: 'actions', header: '' }
]

function errorMessage(error: unknown) {
  return (error as { statusMessage?: string })?.statusMessage ?? 'Something went wrong'
}

async function update(u: AdminUser, patch: Partial<Pick<AdminUser, 'role' | 'disabled'>>) {
  try {
    await api(`/api/admin/users/${u.uid}`, { method: 'PATCH', body: patch })
    await refresh()
  } catch (error) {
    toast.add({ title: 'Update failed', description: errorMessage(error), color: 'error' })
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
    toast.add({ title: 'Could not create user', description: errorMessage(error), color: 'error' })
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
  toast.add({ title: 'Link copied' })
}
</script>

<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl">
        Users
      </h1>
      <UButton
        label="Add user"
        icon="i-lucide-plus"
        @click="open = true"
      />
    </div>

    <UTable
      :data="users ?? []"
      :columns="columns"
      :loading="status === 'pending'"
    >
      <template #role-cell="{ row }">
        <USelect
          :model-value="row.original.role"
          :items="['staff', 'admin']"
          :disabled="row.original.uid === me?.uid"
          class="w-28"
          @update:model-value="update(row.original, { role: $event as AdminUser['role'] })"
        />
      </template>
      <template #lastSignIn-cell="{ row }">
        {{ row.original.lastSignIn ? new Date(row.original.lastSignIn).toLocaleString() : 'Never' }}
      </template>
      <template #actions-cell="{ row }">
        <UButton
          v-if="row.original.uid !== me?.uid"
          :label="row.original.disabled ? 'Enable' : 'Disable'"
          :color="row.original.disabled ? 'neutral' : 'error'"
          variant="ghost"
          size="sm"
          @click="update(row.original, { disabled: !row.original.disabled })"
        />
      </template>
    </UTable>

    <UModal
      v-model:open="open"
      title="Add user"
      @after-leave="close"
    >
      <template #body>
        <div
          v-if="setPasswordLink"
          class="space-y-3"
        >
          <p class="text-sm">
            User created. Send them this link so they can set a password. It is shown only once.
          </p>
          <UInput
            :model-value="setPasswordLink"
            readonly
            class="w-full"
          />
          <UButton
            label="Copy link"
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
            label="Email"
            required
          >
            <UInput
              v-model="form.email"
              type="email"
              required
              class="w-full"
            />
          </UFormField>
          <UFormField label="Role">
            <USelect
              v-model="form.role"
              :items="['staff', 'admin']"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="submit"
            label="Create user"
            :loading="creating"
          />
        </form>
      </template>
    </UModal>
  </UContainer>
</template>

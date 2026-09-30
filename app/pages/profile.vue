<script setup lang="ts">
const { user, role, displayName, hasDisplayName, updateDisplayName } = useAuth()
const toast = useToast()

const name = ref(hasDisplayName.value ? displayName.value : '')
const error = ref('')
const saving = ref(false)

async function save() {
  const parsed = displayNameSchema.safeParse(name.value)
  if (!parsed.success) {
    error.value = parsed.error.issues[0]!.message
    return
  }
  error.value = ''
  saving.value = true
  try {
    await updateDisplayName(parsed.data)
    toast.add({ title: 'Profiel bijgewerkt' })
  } catch {
    toast.add({ title: 'Profiel bijwerken mislukt', color: 'error' })
  } finally {
    saving.value = false
  }
}

const lastSignIn = computed(() =>
  user.value?.metadata.lastSignInTime ? new Date(user.value.metadata.lastSignInTime).toLocaleString() : '—'
)
</script>

<template>
  <UContainer class="py-8 max-w-2xl space-y-6">
    <h1 class="text-2xl">
      Profiel
    </h1>

    <div class="flex items-center gap-4">
      <UAvatar
        :text="displayName.slice(0, 2).toUpperCase()"
        :src="user?.photoURL ?? undefined"
        size="3xl"
      />
      <div>
        <p class="text-lg font-semibold">
          {{ displayName }}
        </p>
        <UBadge
          :label="ROLE_LABELS[role]"
          :color="role === 'admin' ? 'primary' : 'neutral'"
          variant="subtle"
        />
      </div>
    </div>

    <UPageCard>
      <form
        class="space-y-4"
        @submit.prevent="save"
      >
        <UFormField
          label="Weergavenaam"
          help="Zichtbaar voor je collega's, bijvoorbeeld als maker van een project."
          :error="error"
        >
          <UInput
            v-model="name"
            placeholder="Je naam"
            class="w-full"
          />
        </UFormField>
        <UFormField label="E-mail">
          <UInput
            :model-value="user?.email ?? ''"
            disabled
            class="w-full"
          />
        </UFormField>
        <UFormField label="Laatst ingelogd">
          <p class="text-sm">
            {{ lastSignIn }}
          </p>
        </UFormField>
        <UButton
          type="submit"
          label="Opslaan"
          :loading="saving"
        />
      </form>
    </UPageCard>
  </UContainer>
</template>

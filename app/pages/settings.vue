<script setup lang="ts">
const { canChangePassword, sendPasswordReset, user } = useAuth()
const toast = useToast()

const onlyMine = useCookie<boolean>('pref-only-mine', { default: () => false, maxAge: 60 * 60 * 24 * 365 })

const sending = ref(false)
async function resetPassword() {
  sending.value = true
  try {
    await sendPasswordReset()
    toast.add({ title: 'E-mail verzonden', description: `Controleer ${user.value?.email} voor een link om een nieuw wachtwoord in te stellen.` })
  } catch {
    toast.add({ title: 'E-mail verzenden mislukt', color: 'error' })
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-2xl space-y-6">
    <h1 class="text-2xl">
      Instellingen
    </h1>

    <UPageCard
      title="Weergave"
      description="Kies lichte of donkere modus, of volg je apparaat."
    >
      <UColorModeSelect class="w-48" />
    </UPageCard>

    <UPageCard
      title="Projecten"
      description="Geldt voor de projectenlijst."
    >
      <USwitch
        v-model="onlyMine"
        label="Begin met alleen mijn projecten"
      />
    </UPageCard>

    <UPageCard
      title="Beveiliging"
      description="Wachtwoord en inloggen."
    >
      <div v-if="canChangePassword">
        <UButton
          label="Wachtwoord-resetmail versturen"
          color="neutral"
          variant="subtle"
          :loading="sending"
          @click="resetPassword"
        />
      </div>
      <p
        v-else
        class="text-sm text-muted"
      >
        Je logt in met Google, dus je wachtwoord wordt beheerd via je Google-account.
      </p>
    </UPageCard>
  </UContainer>
</template>

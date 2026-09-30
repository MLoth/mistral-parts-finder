<script setup lang="ts">
const { canChangePassword, sendPasswordReset, user } = useAuth()
const toast = useToast()

const onlyMine = useCookie<boolean>('pref-only-mine', { default: () => false, maxAge: 60 * 60 * 24 * 365 })

const sending = ref(false)
async function resetPassword() {
  sending.value = true
  try {
    await sendPasswordReset()
    toast.add({ title: 'Email sent', description: `Check ${user.value?.email} for a link to set a new password.` })
  } catch {
    toast.add({ title: 'Could not send the email', color: 'error' })
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-2xl space-y-6">
    <h1 class="text-2xl">
      Settings
    </h1>

    <UPageCard
      title="Appearance"
      description="Choose light or dark mode, or follow your device."
    >
      <UColorModeSelect class="w-48" />
    </UPageCard>

    <UPageCard
      title="Projects"
      description="Applies to the project list."
    >
      <USwitch
        v-model="onlyMine"
        label="Start with only my projects"
      />
    </UPageCard>

    <UPageCard
      title="Security"
      description="Password and sign-in."
    >
      <div v-if="canChangePassword">
        <UButton
          label="Send password reset email"
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
        You sign in with Google, so your password is managed by your Google account.
      </p>
    </UPageCard>
  </UContainer>
</template>
